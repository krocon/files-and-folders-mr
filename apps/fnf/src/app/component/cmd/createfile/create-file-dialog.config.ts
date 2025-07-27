import {MatDialogConfig} from "@angular/material/dialog";
import {CreateFileDialogData} from "./create-file-dialog.data";

export class CreateFileDialogConfig extends MatDialogConfig {


  constructor(public override data: CreateFileDialogData) {
    super();
    this.minHeight = 200;
    this.minWidth = "700px";
  }
}
