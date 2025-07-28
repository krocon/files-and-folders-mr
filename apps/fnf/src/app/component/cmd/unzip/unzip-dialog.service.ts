import {Injectable} from "@angular/core";
import {UnzipDialogData} from "./unzip-dialog.data";
import {UnzipDialogComponent} from "./unzip-dialog.component";
import {takeWhile} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {UnzipDialogConfig} from "./unzip-dialog.config";
import {UnzipDialogResultData} from "./unzip-dialog-result.data";

@Injectable({
  providedIn: "root"
})
export class UnzipDialogService {


  constructor(
    public readonly dialog: MatDialog
  ) {
  }


  public open(data: UnzipDialogData, cb: (result: UnzipDialogResultData | undefined) => void) {
    let alive = true;
    const config = new UnzipDialogConfig(data);

    return this.dialog
      .open<UnzipDialogComponent, UnzipDialogData, UnzipDialogResultData | undefined>(UnzipDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(item => {
        alive = false;
        cb(item);
      });
  }

}
