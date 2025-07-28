import {Component, Inject} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import {UnzipDialogData} from "./unzip-dialog.data";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatError, MatFormField, MatInput} from "@angular/material/input";
import {MatButton} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FnfAutofocusDirective} from "../../../common/directive/fnf-autofocus.directive";
import {UnzipDialogResultData} from "./unzip-dialog-result.data";
import {FileItem} from "@fnf-data";
import {FnfFilenameValidation} from "../../../common/fnf-filename-validation";

@Component({
  selector: "fnf-unzip-dialog",
  templateUrl: "./unzip-dialog.component.html",
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    MatIconModule,
    MatInput,
    MatButton,
    MatDialogActions,
    MatFormField,
    FnfAutofocusDirective,
    MatError
  ],
  styleUrls: ["./unzip-dialog.component.css"]
})
export class UnzipDialogComponent {

  formGroup: FormGroup;


  constructor(
    public dialogRef: MatDialogRef<UnzipDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnzipDialogData,
    private readonly formBuilder: FormBuilder,
  ) {

    this.formGroup = this.formBuilder.group(
      {
        target: new FormControl(
          data.folderName,
          {
            validators: [
              Validators.required,
              Validators.minLength(1),
              Validators.maxLength(255),
              (control: AbstractControl): ValidationErrors | null => {
                if (control.value && data.existingSubdirectories.includes(control.value)) {
                  return {
                    "is_same": true
                  };
                }
                return null;
              },
              FnfFilenameValidation.validateSpecialNames,
              FnfFilenameValidation.validateChars,
              FnfFilenameValidation.validateReservedNames,
              FnfFilenameValidation.validateStartEndChars,
              // FnfFilenameValidation.checkSpacesUnderscores,
            ]
          })
      }
    );
  }


  get errorMessage(): string {
    const targetControl = this.formGroup.get('target');
    if (!targetControl || !targetControl.errors) return '';

    // Use the common error message function - this is always a folder
    return FnfFilenameValidation.getErrorMessage(targetControl.errors, true);
  }


  onOkClicked() {
    this.dialogRef
      .close(new UnzipDialogResultData(
        new FileItem(this.data.source, this.formGroup.getRawValue().target)
      ));
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }


}
