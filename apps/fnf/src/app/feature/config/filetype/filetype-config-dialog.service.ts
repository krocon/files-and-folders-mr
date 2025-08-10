import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {takeWhile} from "rxjs/operators";
import {FiletypeConfigDialogComponent} from "./filetype-config-dialog.component";
import {FiletypeConfigDialogConfig} from "./filetype-config-dialog.config";

@Injectable({providedIn: 'root'})
export class FiletypeConfigDialogService {
  constructor(private readonly dialog: MatDialog) {
  }

  open(cb: (saved: boolean | undefined) => void) {
    let alive = true;
    const config = new FiletypeConfigDialogConfig();
    return this.dialog
      .open<FiletypeConfigDialogComponent, any, boolean | undefined>(FiletypeConfigDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(res => {
        alive = false;
        cb(res);
      });
  }
}
