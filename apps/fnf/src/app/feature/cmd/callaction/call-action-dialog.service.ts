import {Injectable} from "@angular/core";
import {CallActionDialogComponent} from "./call-action-dialog.component";
import {takeWhile} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {CallActionDialogConfig} from "./call-action-dialog.config";

@Injectable({
  providedIn: "root"
})
export class CallActionDialogService {


  constructor(
    public readonly dialog: MatDialog,
  ) {
  }


  public open(cb: (target: string | undefined) => void) {
    let alive = true;
    const config = new CallActionDialogConfig();
    return this.dialog
      .open<CallActionDialogComponent, string | undefined>(CallActionDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(item => {
        cb(item);
        alive = false;
      });
  }

}
