import {Injectable} from "@angular/core";
import {CreateFileDialogData} from "./create-file-dialog.data";
import {CreateFileDialogComponent} from "./create-file-dialog.component";
import {takeWhile} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {CreateFileDialogConfig} from "./create-file-dialog.config";
import {CreateFileDialogResultData} from "./create-file-dialog-result.data";

@Injectable({
  providedIn: "root"
})
export class CreateFileDialogService {


  constructor(
    public readonly dialog: MatDialog
  ) {
  }


  public open(data: CreateFileDialogData, cb: (result: CreateFileDialogResultData | undefined) => void) {
    let alive = true;
    const config = new CreateFileDialogConfig(data);

    return this.dialog
      .open<CreateFileDialogComponent, CreateFileDialogData, CreateFileDialogResultData | undefined>(CreateFileDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(item => {
        alive = false;
        cb(item);
      });
  }

}
