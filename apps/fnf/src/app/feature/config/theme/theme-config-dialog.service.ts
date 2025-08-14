import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {takeWhile} from "rxjs/operators";
import {ThemeConfigDialogComponent} from "./theme-config-dialog.component";
import {ThemeConfigDialogConfig} from "./theme-config-dialog.config";

@Injectable({providedIn: 'root'})
export class ThemeConfigDialogService {
  constructor(private readonly dialog: MatDialog) {
  }

  open(cb: (saved: boolean | undefined) => void) {
    let alive = true;
    const config = new ThemeConfigDialogConfig();
    return this.dialog
      .open<ThemeConfigDialogComponent, any, boolean | undefined>(ThemeConfigDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(res => {
        alive = false;
        cb(res);
      });
  }
}