import {
  AfterContentInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from "@angular/core";

const BASE_TIMER_DELAY = 50;

/**
 * @directive FnfAutofocusDirective
 * @description
 * Angular directive that automatically focuses an element based on a condition.
 * The directive applies focus to the host element after an optional delay when the condition evaluates to true.
 *
 * This is particularly useful for forms, dialogs, and other interactive components where you want to
 * automatically focus a specific input element when it becomes visible or relevant to the user.
 *
 * @usageNotes
 * ### Basic Usage
 *
 * ```html
 * <!-- Focus input element immediately when component initializes -->
 * <input fnfAutofocus="true">
 *
 * <!-- Focus only when a specific condition is true -->
 * <input [fnfAutofocus]="shouldFocus">
 *
 * <!-- Focus with a custom delay (in milliseconds) -->
 * <input fnfAutofocus="true" [fnfAutofocusDelay]="1000">
 * ```
 *
 * ### Dynamic Focus Control
 *
 * The directive reacts to changes in the condition input, allowing you to control focus dynamically:
 *
 * ```html
 * <!-- Focus will be applied or removed when formIsValid changes -->
 * <input [fnfAutofocus]="formIsValid">
 * ```
 *
 * ### Usage in Dialogs
 *
 * This directive is especially useful in dialog components to automatically focus the primary input:
 *
 * ```html
 * <mat-dialog-content>
 *   <form [formGroup]="formGroup">
 *     <mat-form-field>
 *       <input matInput
 *              formControlName="pattern"
 *              placeholder="Search pattern"
 *              fnfAutofocus="true"
 *              [fnfAutofocusDelay]="300">
 *     </mat-form-field>
 *   </form>
 * </mat-dialog-content>
 * ```
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'search-dialog',
 *   template: `
 *     <mat-dialog-content>
 *       <form [formGroup]="searchForm">
 *         <mat-form-field>
 *           <input matInput
 *                  formControlName="searchTerm"
 *                  placeholder="Search"
 *                  fnfAutofocus="true"
 *                  [fnfAutofocusDelay]="500">
 *         </mat-form-field>
 *         <button mat-button (click)="search()">Search</button>
 *       </form>
 *     </mat-dialog-content>
 *   `
 * })
 * export class SearchDialogComponent {
 *   searchForm = this.fb.group({
 *     searchTerm: ['', Validators.required]
 *   });
 *
 *   constructor(private fb: FormBuilder) {}
 *
 *   search(): void {
 *     if (this.searchForm.valid) {
 *       // Perform search with the form value
 *     }
 *   }
 * }
 * ```
 *
 * @input fnfAutofocus - Boolean or string condition that determines if the element should be focused.
 *        When set to "true" or true, the element will be focused after the specified delay.
 *        Default: false
 *
 * @input fnfAutofocusDelay - Number or string representing the delay in milliseconds before applying focus.
 *        If a string is provided, it will be converted to a number.
 *        Default: BASE_TIMER_DELAY (typically 100ms)
 */
@Directive({
  selector: "[fnfAutofocus]"
})
export class FnfAutofocusDirective implements AfterContentInit, OnChanges, OnDestroy {

  @Input()
  public fnfAutofocusDelay: number | string = BASE_TIMER_DELAY;

  private timeout?: any; // number;

  constructor(
    private readonly elementRef: ElementRef,
    private readonly ngZone: NgZone) {
  }

  private _condition = false;

  @Input("fnfAutofocus")
  set condition(value: string | boolean) {
    this._condition = value === "true" || ('' + value) === "true";
  }

  public ngAfterContentInit(): void {
    if (this._condition) {
      this.startFocusWorkflow();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['timerDelay'] && typeof this.fnfAutofocusDelay !== "number") {
      if (isNaN((this.fnfAutofocusDelay = +this.fnfAutofocusDelay))) {
        this.fnfAutofocusDelay = BASE_TIMER_DELAY;
      }
    }
    if (this._condition) {
      this.startFocusWorkflow();
    } else {
      this.stopFocusWorkflow();
    }
  }

  public ngOnDestroy(): void {
    this.stopFocusWorkflow();
  }

  private startFocusWorkflow(): void {
    if (this.timeout) {
      return; // skip
    }
    this.ngZone.runOutsideAngular(() => {
      if (this._condition) {
        this.timeout = setTimeout(() => {
          this.timeout = undefined;
          this.elementRef.nativeElement.focus();
        }, this.fnfAutofocusDelay as number);
      }
    });
  }

  private stopFocusWorkflow(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = undefined;
  }
}
