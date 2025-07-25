import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { Terminal } from 'xterm';
import { CanvasAddon } from '@xterm/addon-canvas';
import { FitAddon } from '@xterm/addon-fit';
import { ServershellService } from "./service/servershell.service";
import { ShellSpawnResultIf } from "@fnf/fnf-data";
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: "fnf-servershell",
  templateUrl: "./servershell.component.html",
  styleUrls: ["./servershell.component.css"],
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServershellComponent implements OnInit, OnDestroy {
  @ViewChild('terminalContainer', {static: true}) terminalContainer!: ElementRef<HTMLDivElement>;

  private terminal: Terminal | null = null;
  private canvasAddon: CanvasAddon | null = null;
  private fitAddon: FitAddon | null = null;
  private inputBuffer: string = '';
  private prompt = '$ ';
  private path = '/';
  private rid = Math.random().toString(36).substring(2, 15);
  private lastCompletions: string[] = [];
  private lastCompletionIndex: number = -1;
  private lastCompletionInput: string = '';

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly shellService: ServershellService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.terminal = new Terminal({
        // cols and rows will be set by fitAddon
        convertEol: true,
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
        },
        scrollback: 1000,
      });
      this.canvasAddon = new CanvasAddon();
      this.fitAddon = new FitAddon();
      this.terminal.loadAddon(this.canvasAddon);
      this.terminal.loadAddon(this.fitAddon);
      this.terminal.open(this.terminalContainer.nativeElement);
      this.fitAddon.fit();
      this.terminal.focus();
      this.printPrompt();
      this.terminal.onData(data => this.handleInput(data));
      window.addEventListener('resize', this.handleResize);
    });
  }

  ngOnDestroy(): void {
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
    this.canvasAddon = null;
    if (this.fitAddon) {
      window.removeEventListener('resize', this.handleResize);
      this.fitAddon = null;
    }
  }

  private printPrompt() {
    if (this.terminal) {
      this.terminal.write(`\r\n${this.path}${this.prompt}`);
      this.inputBuffer = '';
    }
  }

  private handleInput(data: string) {
    if (!this.terminal) return;
    for (const char of data) {
      if (char !== '\t') {
        this.lastCompletions = [];
        this.lastCompletionIndex = -1;
        this.lastCompletionInput = '';
      }
      if (char === '\r') { // Enter
        this.terminal.write('\r\n');
        const command = this.inputBuffer.trim();
        if (command.length > 0) {
          this.executeCommand(command);
        } else {
          this.printPrompt();
        }
      } else if (char === '\u007F' || char === '\b') { // Backspace
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.terminal.write('\b \b');
        }
      } else if (char === '\t') { // TAB for autocomplete
        this.handleAutocomplete();
      } else if (char >= ' ' && char <= '~') { // Printable
        this.inputBuffer += char;
        this.terminal.write(char);
      }
    }
  }

  private async handleAutocomplete() {
    if (!this.terminal) return;
    // Split input buffer into tokens
    const tokens = this.inputBuffer.split(/\s+/);
    const lastToken = tokens[tokens.length - 1] || '';

    let completions: string[] = [];
    if (
      this.lastCompletions.length > 1 &&
      this.lastCompletionInput === this.inputBuffer
    ) {
      completions = this.lastCompletions;
    } else {
      completions = await this.shellService.getAutocomplete(this.inputBuffer);
      this.lastCompletions = completions;
      this.lastCompletionIndex = -1;
      this.lastCompletionInput = this.inputBuffer;
    }

    if (completions.length === 0) {
      this.terminal.write('\x07');
      return;
    }
    if (completions.length === 1) {
      // Complete only the last token
      const completion = completions[0];
      let append = '';
      for (let i = 0; i < completion.length; i++) {
        if (completion[i] !== lastToken[i]) {
          append = completion.slice(i);
          break;
        }
      }
      // Replace last token in inputBuffer
      tokens[tokens.length - 1] = completion;
      this.inputBuffer = tokens.join(' ');
      this.terminal.write(append);
      this.lastCompletions = [];
      this.lastCompletionIndex = -1;
      this.lastCompletionInput = '';
    } else {
      // Cycle through completions
      this.lastCompletionIndex = (this.lastCompletionIndex + 1) % completions.length;
      const completion = completions[this.lastCompletionIndex];
      // Replace last token in inputBuffer
      tokens[tokens.length - 1] = completion;
      this.inputBuffer = tokens.join(' ');
      // Redraw the prompt and input
      this.terminal.write('\r');
      this.terminal.write(this.path + this.prompt + this.inputBuffer);
    }
  }

  private executeCommand(command: string) {
    const emitKey = `ServerShell${this.rid}`;
    const cancelKey = `cancelServerShell${this.rid}`;
    this.shellService.doSpawn({
      cmd: command,
      emitKey: emitKey,
      cancelKey: cancelKey,
      timeout: 60000,
      dir: this.path
    }, (result: ShellSpawnResultIf) => {
      if (result.emitKey !== emitKey) return;
      if (result.currentDir && result.currentDir !== this.path) {
        this.path = result.currentDir;
      }
      if (result.out) {
        this.terminal?.write(result.out.replace(/\n/g, '\r\n'));
      }
      if (result.error) {
        this.terminal?.write(`\r\n[Error] ${result.error}\r\n`);
      }
      if (result.done) {
        this.printPrompt();
      }
      this.cdr.detectChanges();
    });
  }

  navigateToFiles() {
    this.router.navigate(['/files']);
  }

  private handleResize = () => {
    if (this.fitAddon) {
      this.fitAddon.fit();
    }
  }
}
