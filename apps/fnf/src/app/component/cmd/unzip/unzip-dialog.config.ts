import {MatDialogConfig} from "@angular/material/dialog";
import {UnzipDialogData} from "./unzip-dialog.data";

export class UnzipDialogConfig extends MatDialogConfig {


  constructor(public override data: UnzipDialogData) {
    super();
    this.minHeight = 200;
    this.minWidth = "700px";
  }
}
