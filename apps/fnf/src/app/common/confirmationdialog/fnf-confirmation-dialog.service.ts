import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {Observable} from "rxjs";
import {FnfConfirmationDialogComponent} from "./fnf-confirmation-dialog.component";
import {takeWhile} from "rxjs/operators";
import {ConfirmationData} from "./data/confirmation.data";
import {ButtonData} from "./data/button.data";


/**
 * @class FnfConfirmationDialogService
 * @description A service that provides methods for displaying different types of dialog boxes to the user.
 * This service is built on top of Angular Material's MatDialog and provides a simplified interface
 * for common dialog use cases such as confirmations, error messages, and information messages.
 *
 * @example
 * // Basic confirmation dialog
 * const confirmData = new ConfirmationData(
 *   'Confirm Action',                                                   // Title
 *   ['Are you sure you want to perform this action?'],                  // Message(s)
 *   [                                                                   // Buttons
 *     new ButtonData('CONFIRM', 'Yes', 'primary'),
 *     new ButtonData('CANCEL', 'No', '')
 *   ]
 * );
 *
 * this.confirmationService.confirm(confirmData).subscribe(result => {
 *   if (result === 'CONFIRM') {
 *     // User confirmed the action
 *     this.performAction();
 *   } else {
 *     // User cancelled or closed the dialog
 *     this.cancelAction();
 *   }
 * });
 *
 * @example
 * // Error dialog
 * this.confirmationService.showError([
 *   'An error occurred while processing your request.',
 *   'Please try again later or contact support.'
 * ]).subscribe(() => {
 *   // Dialog was closed
 *   this.logErrorAcknowledged();
 * });
 *
 * @example
 * // Information dialog
 * this.confirmationService.showInfo([
 *   'Your changes have been saved successfully.',
 *   'The changes will take effect on next login.'
 * ]).subscribe(() => {
 *   // Dialog was closed
 *   this.navigateToHome();
 * });
 *
 * @example
 * // Simple confirmation with callback
 * this.confirmationService.simpleConfirm(
 *   'Delete selected items?',          // Question
 *   ['Delete', 'Cancel'],              // Button labels
 *   (confirmed) => {                   // Callback
 *     if (confirmed) {
 *       this.deleteItems();
 *     }
 *   }
 * );
 */
@Injectable({
  providedIn: "root"
})
export class FnfConfirmationDialogService {

  constructor(public dialog: MatDialog) {
  }

  /**
   * Opens a customizable confirmation dialog with the specified configuration.
   *
   * @param {ConfirmationData} data - The configuration object for the dialog
   * @returns {Observable<string>} An Observable that emits the key of the button that was clicked when the dialog is closed
   *
   * @example
   * const dialogData = new ConfirmationData(
   *   'Rename File',                                                      // Title
   *   ['Are you sure you want to rename this file?'],                     // Messages
   *   [                                                                   // Buttons
   *     new ButtonData('YES', 'Yes', 'primary'),
   *     new ButtonData('NO', 'No', '')
   *   ],
   *   '400px',                                                            // Width
   *   '',                                                                 // Height (auto)
   *   false,                                                              // Vertical button layout
   *   [                                                                   // Input fields
   *     new InputData('filename', 'New filename', 'text', 'document.txt')
   *   ],
   *   'custom-dialog-class'                                               // CSS class
   * );
   *
   * this.confirmationService.confirm(dialogData).subscribe(result => {
   *   if (result === 'YES') {
   *     const newFilename = dialogData.inputModel['filename'];
   *     this.renameFile(newFilename);
   *   }
   * });
   */
  public confirm(data: ConfirmationData): Observable<string> {
    return this.dialog
      .open(FnfConfirmationDialogComponent, {
        height: data.height,
        width: data.width,
        data,
        disableClose: false
      })
      .afterClosed();
  }

  /**
   * Opens an error dialog with the specified error messages.
   * The dialog has a red color theme and a single "Close" button.
   *
   * @param {Array<string>} phrases - An array of error messages to display in the dialog
   * @returns {Observable<FnfConfirmationDialogComponent>} An Observable that emits when the dialog is closed
   *
   * @example
   * // Single error message
   * this.confirmationService.showError(['Operation failed. Please try again.']);
   *
   * @example
   * // Multiple error messages
   * this.confirmationService.showError([
   *   'Unable to save file.',
   *   'The file may be read-only or you may not have permission.',
   *   'Error code: ACCESS_DENIED'
   * ]).subscribe(() => {
   *   // This code runs when the error dialog is closed
   *   this.resetForm();
   * });
   */
  public showError(phrases: Array<string>): Observable<FnfConfirmationDialogComponent> {
    const title = "Error";
    const buttons: Array<ButtonData> = [new ButtonData("CANCEL", "Close", "warn")];
    const data: ConfirmationData = new ConfirmationData(title, phrases, buttons);
    data.cssClass = "fnf-color-red-1";
    return this.dialog
      .open(FnfConfirmationDialogComponent, {
        height: data.height,
        width: data.width,
        data,
        disableClose: false
      })
      .afterClosed();
  }

  /**
   * Opens an information dialog with the specified information messages.
   * The dialog has a single "Close" button.
   *
   * @param {Array<string>} phrases - An array of information messages to display in the dialog
   * @returns {Observable<FnfConfirmationDialogComponent>} An Observable that emits when the dialog is closed
   *
   * @example
   * // Simple information message
   * this.confirmationService.showInfo(['Operation completed successfully.']);
   *
   * @example
   * // Multiple information messages with follow-up action
   * this.confirmationService.showInfo([
   *   'Your account has been created.',
   *   'A verification email has been sent to your inbox.',
   *   'Please verify your email address to complete the registration process.'
   * ]).subscribe(() => {
   *   this.router.navigate(['/login']);
   * });
   */
  public showInfo(phrases: Array<string>): Observable<FnfConfirmationDialogComponent> {
    const title = "Info";
    const buttons: Array<ButtonData> = [new ButtonData("CANCEL", "Close", "warn")];
    const data: ConfirmationData = new ConfirmationData(title, phrases, buttons);
    return this.dialog
      .open(FnfConfirmationDialogComponent, {
        height: data.height,
        width: data.width,
        data,
        disableClose: false
      })
      .afterClosed();
  }

  /**
   * Opens a simple confirmation dialog with a question and two buttons.
   * This is a convenience method for common Yes/No confirmation scenarios.
   *
   * @param {string} question - The question or message to display in the dialog
   * @param {string[]} labels - An array of two strings for the button labels (e.g., ['Yes', 'No'])
   * @param {(b: boolean) => void} cb - A callback function that receives true if the first button was clicked, false otherwise
   * @returns {MatDialogRef<FnfConfirmationDialogComponent>} A reference to the opened dialog
   *
   * @example
   * // Basic usage with default button labels
   * this.confirmationService.simpleConfirm(
   *   'Delete the selected file?',
   *   ['Yes', 'No'],
   *   (confirmed) => {
   *     if (confirmed) {
   *       this.deleteFile();
   *     }
   *   }
   * );
   *
   * @example
   * // Custom button labels
   * this.confirmationService.simpleConfirm(
   *   'Do you want to save changes before closing?',
   *   ['Save', 'Discard'],
   *   (saveChanges) => {
   *     if (saveChanges) {
   *       this.saveChanges().then(() => this.closeEditor());
   *     } else {
   *       this.closeEditor();
   *     }
   *   }
   * );
   */
  public simpleConfirm(question: string, labels: string[], cb: (b: boolean) => void) {
    let alive = true;
    const data = new ConfirmationData(
      "",
      [question],
      [new ButtonData("BTN-0", labels[0], "primary"), new ButtonData("BTN-1", labels[1], "")]
    );
    const dlg = this.dialog.open(FnfConfirmationDialogComponent, {
      height: data.height,
      width: data.width,
      data,
      disableClose: false
    });
    dlg
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(key => {
        alive = false;
        cb(key === "BTN-0");
      });
    return dlg;
  }
}