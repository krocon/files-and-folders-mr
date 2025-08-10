import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {takeWhile} from "rxjs/operators";
import {ToolConfigDialogComponent} from "./tool-config-dialog.component";
import {ToolConfigDialogConfig} from "./tool-config-dialog.config";

@Injectable({providedIn: 'root'})
export class ToolConfigDialogService {
  constructor(private readonly dialog: MatDialog) {
  }

  open(cb: (saved: boolean | undefined) => void) {
    let alive = true;
    const config = new ToolConfigDialogConfig();
    return this.dialog
      .open<ToolConfigDialogComponent, any, boolean | undefined>(ToolConfigDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(res => {
        alive = false;
        cb(res);
      });
  }
}