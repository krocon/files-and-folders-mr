import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';


@Component({
  selector: 'app-countup',
  standalone: true,
  template: '<div #cmp></div>',
  styles: [`
      div {
          display: inline-block;
          font-variant-numeric: slahed-zero;
      }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FnfCountupComponent implements OnDestroy, AfterViewInit {


  @Input() startTimeInMillis: number = 0;
  @Input() diffTimeInMillis = -1;
  @Output() timeout = new EventEmitter();

  @ViewChild('cmp', {static: true}) private readonly div?: ElementRef<HTMLElement>;

  private alive = true;


  constructor(
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef) {
    this.cdr.detach();
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  ngAfterViewInit(): void {
    this.startTimeInMillis = Date.now();

    this.ngZone.runOutsideAngular(() => {
      // Der erste Aufruf (, später rekursiv):
      requestAnimationFrame(this.updateText.bind(this));
    });
  }


  private updateText(): void {
    if (!this.alive) {
      return; // skip
    }
    const now = Date.now();
    const spentInMillis = now - this.startTimeInMillis;
    const seconds = this.pad((spentInMillis / 1000) % 60);
    const minutes = this.pad((spentInMillis / 1000 / 60) % 60);

    // update GUI:
    if (this.div) this.div.nativeElement.innerText = `${minutes}:${seconds}`;

    if (spentInMillis < this.diffTimeInMillis || this.diffTimeInMillis === -1) {
      setTimeout(() => {
        requestAnimationFrame(this.updateText.bind(this));
      }, 900);
    } else {
      this.ngZone.run(() => {
        this.timeout.emit(now);
      });
    }
  }

  private pad(value: number) {
    const n = Math.floor(value);
    if (n < 10) {
      return '0' + n;
    }
    return n + '';
  }

}
