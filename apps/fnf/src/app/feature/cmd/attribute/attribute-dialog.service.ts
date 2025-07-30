import {Injectable} from "@angular/core";
import {AttributeDialogData} from "./attribute-dialog.data";
import {AttributeDialogComponent} from "./attribute-dialog.component";
import {takeWhile} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {AttributeDialogConfig} from "./attribute-dialog.config";
import {AttributeDialogResultData} from "./attribute-dialog-result.data";

@Injectable({
  providedIn: "root"
})
export class AttributeDialogService {

  constructor(
    public readonly dialog: MatDialog
  ) {
  }

  public open(data: AttributeDialogData, cb: (result: AttributeDialogResultData | undefined) => void) {
    let alive = true;
    const config = new AttributeDialogConfig(data);

    return this.dialog
      .open<AttributeDialogComponent, AttributeDialogData, AttributeDialogResultData | undefined>(AttributeDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(item => {
        alive = false;
        cb(item);
      });
  }
}