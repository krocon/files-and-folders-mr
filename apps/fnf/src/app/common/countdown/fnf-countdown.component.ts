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
  selector: 'app-countdown',
  standalone: true,
  template: '<div #cmp></div>',
  styles: [`
      div {
          display: inline-block;
          font-variant-numeric: slashed-zero;
      }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FnfCountdownComponent implements OnDestroy, AfterViewInit {


  @Input() startTimeInMillis: number = 0;
  @Input() diffTimeInMillis: number = 15 * 60 * 1000;
  @Output() readonly timeout = new EventEmitter();
  @ViewChild('cmp', {static: true}) private readonly div?: ElementRef<HTMLElement>;

  private alive = true;


  constructor(
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.cdr.detach();
  }

  private static pad(value: number) {
    const n = Math.floor(value);
    if (n < 0) {
      return '00:00';
    }
    if (n < 10) {
      return '0' + n;
    }
    return n;
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  ngAfterViewInit(): void {
    this.startTimeInMillis = Date.now();

    // Der erste Aufruf (, später rekursiv):
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(this.updateText.bind(this));
    });
  }

  private updateText(): void {
    if (!this.alive) {
      return; // skip
    }
    const now = Date.now();
    let remainingInMillis = this.startTimeInMillis + this.diffTimeInMillis - now;
    if (remainingInMillis < 0) {
      remainingInMillis = 0;
    }

    const seconds = FnfCountdownComponent.pad((remainingInMillis / 1000) % 60);
    const minutes = FnfCountdownComponent.pad((remainingInMillis / 1000 / 60) % 60);

    // update GUI:
    if (this.div) this.div.nativeElement.innerText = `${minutes}:${seconds}`;

    if (remainingInMillis >= 1000) {
      setTimeout(() => {
        requestAnimationFrame(this.updateText.bind(this));
      }, 500);
    } else {
      this.ngZone.run(() => {
        this.timeout.emit(now);
      });
    }
  }

}
