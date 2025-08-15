import {MatDialogConfig} from "@angular/material/dialog";

export class CallActionDialogConfig extends MatDialogConfig {


  constructor() {
    super();
    this.minHeight = 100;
    this.minWidth = "700px";
    this.panelClass = "fnf-dialog-primary";
  }
}
