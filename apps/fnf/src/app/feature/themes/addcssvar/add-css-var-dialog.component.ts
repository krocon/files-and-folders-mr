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
import {AddCssVarDialogData} from "./add-css-var-dialog.data";
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
import {AddCssVarDialogResultData} from "./add-css-var-dialog-result.data";
import {MatFormFieldModule} from "@angular/material/form-field";

@Component({
  selector: "fnf-add-css-var-dialog",
  templateUrl: "./add-css-var-dialog.component.html",
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    MatIconModule,
    MatInput,
    MatButton,
    MatDialogActions,
    MatFormField,
    MatFormFieldModule,
    FnfAutofocusDirective,
    MatError
  ],
  styleUrls: ["./add-css-var-dialog.component.css"]
})
export class AddCssVarDialogComponent {

  formGroup: FormGroup;

  textSuffix = '-color';
  textPrefix = '--fnf-';


  constructor(
    public dialogRef: MatDialogRef<AddCssVarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: AddCssVarDialogData,
    private readonly formBuilder: FormBuilder,
  ) {

    this.formGroup = this.formBuilder.group(
      {
        target: new FormControl(
          '',
          {
            validators: [
              Validators.required,
              Validators.minLength(1),
              Validators.maxLength(255),
              (control: AbstractControl): ValidationErrors | null => {

                if (control.value && control.value.startsWith('-')) {
                  return {"invalid": "Cannot start with '-'"};
                }
                if (control.value && control.value.endsWith('-')) {
                  return {"invalid": "Cannot end with '-'"};
                }
                if (control.value && control.value.includes('--')) {
                  return {"invalid": "Cannot contain '--'"};
                }
                const v = this.textPrefix + control.value + this.textSuffix;
                if (control.value && Object.keys(this.data.selectedTheme.colors).includes(v)) {
                  return {
                    "invalid": "Already exists"
                  };
                }
                return null;
              },
            ]
          })
      }
    );
  }


  onOkClicked() {
    this.dialogRef
      .close(new AddCssVarDialogResultData(this.textPrefix + this.formGroup.getRawValue().target + this.textSuffix));
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }


}
