import {Directive, EventEmitter, HostListener, Input, Output} from '@angular/core';


/**
 * @directive LongPressDirective
 * @description
 * An Angular directive that detects when an element has been pressed and held for a specified duration.
 * This directive supports both mouse and touch events, making it suitable for desktop and mobile applications.
 *
 * The directive listens for mousedown/touchstart events and starts a timer. If the user keeps pressing
 * for the specified duration, it emits a longPress event. The timer is cleared if the user releases
 * the press (mouseup/touchend) or moves away from the element (mouseleave) before the duration completes.
 *
 * @selector [appLongPress]
 *
 * @example
 * Basic usage:
 * ```html
 * <button appLongPress (longPress)="onLongPress($event)">Press and hold me</button>
 * ```
 *
 * With custom duration:
 * ```html
 * <div appLongPress [pressDuration]="1000" (longPress)="onLongPress($event)">
 *   Hold for 1 second
 * </div>
 * ```
 *
 * In component:
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   onLongPress(event: MouseEvent | TouchEvent): void {
 *     console.log('Long press detected!', event);
 *     // Perform actions after long press
 *   }
 * }
 * ```
 */
@Directive({
  selector: '[appLongPress]'
})
export class LongPressDirective {
  /**
   * The duration in milliseconds that the element must be pressed before triggering the longPress event.
   * @default 500
   */
  @Input() pressDuration: number = 500;

  /**
   * Event emitted when the element has been pressed for the specified duration.
   * Emits the original MouseEvent or TouchEvent that initiated the long press.
   */
  @Output() longPress = new EventEmitter<MouseEvent | TouchEvent>();

  /**
   * Reference to the setTimeout timer that tracks the press duration.
   * @private
   */
  private pressTimer: any;

  /**
   * Stores the original event that initiated the press.
   * @private
   */
  private event: MouseEvent | TouchEvent = new MouseEvent('click');

  /**
   * Initializes the LongPressDirective.
   */
  constructor() {
  }

  /**
   * Handler for mousedown and touchstart events.
   * Starts the timer for detecting a long press.
   *
   * @param event The MouseEvent or TouchEvent that triggered the handler
   */
  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPressStart(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.pressTimer = setTimeout(() => {
      this.event = event
      this.longPress.emit(this.event); // Emit event after long press duration
    }, this.pressDuration);
  }

  /**
   * Handler for mouseup and touchend events.
   * Cancels the long press detection if the user releases before the duration completes.
   *
   * @param event The MouseEvent or TouchEvent that triggered the handler
   */
  @HostListener('mouseup', ['$event'])
  @HostListener('touchend', ['$event'])
  onPressEnd(event: MouseEvent | TouchEvent) {
    clearTimeout(this.pressTimer); // Clear the timer if press is released before duration
  }

  /**
   * Handler for mouseleave events.
   * Cancels the long press detection if the cursor leaves the element before the duration completes.
   *
   * @param event The MouseEvent or TouchEvent that triggered the handler
   */
  @HostListener('mouseleave', ['$event'])
  onPressLeave(event: MouseEvent | TouchEvent) {
    clearTimeout(this.pressTimer); // Clear the timer if mouse leaves the area
  }
}