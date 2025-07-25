import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { Terminal } from 'xterm';
import { CanvasAddon } from '@xterm/addon-canvas';


@Component({
  selector: 'app-servershell-out',
  imports: [
    CommonModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  template: `
    <div #terminalContainer class="xterm-container"></div>
  `,
  styles: [`
      :host {
          display: block;
          width: 100%;
          height: 100%;
      }
      .xterm-container {
          width: 100%;
          height: 100%;
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
    private readonly ngZone: NgZone
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
