import {MatDialogConfig} from "@angular/material/dialog";
import {AddCssVarDialogData} from "./add-css-var-dialog.data";

export class AddCssVarDialogConfig extends MatDialogConfig {


  constructor(public override data: AddCssVarDialogData) {
    super();
    this.minHeight = 240;
    this.height = '240px';
    this.minWidth = "500px";
  }
}
