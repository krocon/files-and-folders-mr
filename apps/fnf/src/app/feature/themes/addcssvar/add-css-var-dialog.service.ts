import {Injectable} from "@angular/core";
import {AddCssVarDialogData} from "./add-css-var-dialog.data";
import {AddCssVarDialogComponent} from "./add-css-var-dialog.component";
import {takeWhile} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {AddCssVarDialogConfig} from "./add-css-var-dialog.config";
import {AddCssVarDialogResultData} from "./add-css-var-dialog-result.data";

@Injectable({
  providedIn: "root"
})
export class AddCssVarDialogService {


  constructor(
    public readonly dialog: MatDialog
  ) {
  }


  public open(data: AddCssVarDialogData, cb: (result: AddCssVarDialogResultData | undefined) => void) {
    let alive = true;
    const config = new AddCssVarDialogConfig(data);

    return this.dialog
      .open<AddCssVarDialogComponent, AddCssVarDialogData, AddCssVarDialogResultData | undefined>(AddCssVarDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(item => {
        alive = false;
        cb(item);
      });
  }

}
