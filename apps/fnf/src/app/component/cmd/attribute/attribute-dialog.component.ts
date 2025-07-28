import {Component, Inject} from "@angular/core";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {AttributeDialogData} from "./attribute-dialog.data";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatButton} from "@angular/material/button";
import {AttributeDialogResultData} from "./attribute-dialog-result.data";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {FileAttributeType} from "@fnf-data";

@Component({
  selector: "fnf-attribute-dialog",
  templateUrl: "./attribute-dialog.component.html",
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    MatButton,
    MatDialogActions,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatInput
  ],
  styleUrls: ["./attribute-dialog.component.css"]
})
export class AttributeDialogComponent {

  formGroup: FormGroup;


  constructor(
    public dialogRef: MatDialogRef<AttributeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AttributeDialogData,
    private readonly formBuilder: FormBuilder,
  ) {

    // Initialize current attributes or defaults
    const currentAttributes: FileAttributeType = this.data.selectedFile.attributes || {
      hidden: false,
      archive: false,
      readonly: false,
      system: false
    };

    // Parse current date/time from file
    const currentDate = new Date(this.data.selectedFile.date);
    const dateStr = currentDate.toISOString().split('T')[0];
    const timeStr = currentDate.toTimeString().split(' ')[0].substring(0, 5);

    this.formGroup = this.formBuilder.group({
      // File attributes
      hidden: new FormControl(currentAttributes.hidden),
      archive: new FormControl(currentAttributes.archive),
      readonly: new FormControl(currentAttributes.readonly),
      system: new FormControl(currentAttributes.system),

      // Date/time change
      changeDateTime: new FormControl(false),
      newDate: new FormControl(dateStr),
      newTime: new FormControl(timeStr),
    });
  }

  onOkClicked() {
    const formValue = this.formGroup.getRawValue();

    const attributes: FileAttributeType = {
      hidden: formValue.hidden,
      archive: formValue.archive,
      readonly: formValue.readonly,
      system: formValue.system
    };

    const result = new AttributeDialogResultData(
      this.data.selectedFile,
      attributes,
      formValue.changeDateTime,
      formValue.changeDateTime ? formValue.newDate : undefined,
      formValue.changeDateTime ? formValue.newTime : undefined,
    );

    this.dialogRef.close(result);
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }

}