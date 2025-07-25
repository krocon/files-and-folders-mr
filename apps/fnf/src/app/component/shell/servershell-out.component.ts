import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { Terminal } from 'xterm';
import { CanvasAddon } from '@xterm/addon-canvas';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-servershell-out',
  imports: [
    CommonModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatIcon,
    MatButtonModule,
  ],
  template: `
    <div #terminalContainer class="xterm-container"></div>
    <div class="terminal-footer">
      <div class="terminal-footer-item">
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
      :host {
          display: grid;
          grid-template-rows: 1fr auto;
          width: 100%;
          height: 100%;
      }
      .xterm-container {
          width: 100%;
          height: calc(100% - 58px);
      }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServershellOutComponent implements OnInit, OnDestroy {
  @ViewChild('terminalContainer', {static: true}) terminalContainer!: ElementRef<HTMLDivElement>;

  private terminal: Terminal | null = null;
  private canvasAddon: CanvasAddon | null = null;
  private _displayText: string = '';

  @Input()
  set displayText(value: string) {
    this._displayText = value;
    this.writeToTerminal(value);
  }
  get displayText(): string {
    return this._displayText;
  }

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.terminal = new Terminal({
        convertEol: true,
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
        },
        disableStdin: true,
        scrollback: 1000,
      });
      this.canvasAddon = new CanvasAddon();
      this.terminal.loadAddon(this.canvasAddon);
      this.terminal.open(this.terminalContainer.nativeElement);
      this.writeToTerminal(this._displayText);
    });
  }

  ngOnDestroy(): void {
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
    this.canvasAddon = null;
  }

  close() {
    this.terminal?.dispose();
    this.terminal = null;
    this.canvasAddon = null;
    this.router.navigate(['/files']);
  }

  private writeToTerminal(text: string) {
    if (this.terminal) {
      this.terminal.clear();
      if (text) {
        console.info('writeToTerminal', text); // TODO del
        this.terminal.write(text.replace(/\n/g, '\r\n'));
      }
    }
  }
}
