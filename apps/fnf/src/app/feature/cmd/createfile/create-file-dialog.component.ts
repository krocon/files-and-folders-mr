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
import {CreateFileDialogData} from "./create-file-dialog.data";
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
import {CreateFileDialogResultData} from "./create-file-dialog-result.data";
import {FnfFilenameValidation} from "../../../common/fnf-filename-validation";
import {filepath2FileItem} from "../../../common/fn/filepath-to-file-items";

@Component({
  selector: "fnf-mkdir-dialog",
  templateUrl: "./create-file-dialog.component.html",
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
  styleUrls: ["./create-file-dialog.component.css"]
})
export class CreateFileDialogComponent {

  formGroup: FormGroup;


  constructor(
    public dialogRef: MatDialogRef<CreateFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateFileDialogData,
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
                if (control.value && data.existingFilesOrFolders.includes(control.value)) {
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
    const file = this.formGroup.getRawValue().target;
    const fileItem = filepath2FileItem(this.data.source + '/' + file);
    this.dialogRef.close(new CreateFileDialogResultData(fileItem));
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }


}
