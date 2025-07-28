import {Component, Inject} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {UnzipDialogData} from "./unzip-dialog.data";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatError, MatFormField} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FnfAutofocusDirective} from "../../../common/directive/fnf-autofocus.directive";
import {UnzipDialogResultData} from "./unzip-dialog-result.data";

@Component({
  selector: "fnf-unzip-dialog",
  templateUrl: "./unzip-dialog.component.html",
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    MatIconModule,
    MatSelect,
    MatOption,
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
  source = "";
  directories: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<UnzipDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnzipDialogData,
    private readonly formBuilder: FormBuilder,
  ) {
    console.log(data);
    this.source = data.source.dir + '/' + data.source.base;
    this.directories = data.directories;

    this.formGroup = this.formBuilder.group(
      {
        target: new FormControl(data.targetDir)
      }
    );
  }


  onOkClicked() {
    let target = this.formGroup.getRawValue().target;
    this.dialogRef
      .close(new UnzipDialogResultData(
        this.data.source,
        target
      ));
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }


}
