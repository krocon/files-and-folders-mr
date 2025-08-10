import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {takeWhile} from "rxjs/operators";
import {ButtonConfigDialogComponent} from "./button-config-dialog.component";
import {ButtonConfigDialogConfig} from "./button-config-dialog.config";

@Injectable({providedIn: 'root'})
export class ButtonConfigDialogService {
  constructor(private readonly dialog: MatDialog) {
  }

  open(cb: (saved: boolean | undefined) => void) {
    let alive = true;
    const config = new ButtonConfigDialogConfig();
    return this.dialog
      .open<ButtonConfigDialogComponent, any, boolean | undefined>(ButtonConfigDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(res => {
        alive = false;
        cb(res);
      });
  }
}
