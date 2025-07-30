import {MatDialogConfig} from "@angular/material/dialog";
import {AttributeDialogData} from "./attribute-dialog.data";

export class AttributeDialogConfig extends MatDialogConfig {

  constructor(public override data: AttributeDialogData) {
    super();
    this.minHeight = 350;
    this.minWidth = "500px";
  }
}