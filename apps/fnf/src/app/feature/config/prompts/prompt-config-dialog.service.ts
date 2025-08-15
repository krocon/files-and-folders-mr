import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {takeWhile} from "rxjs/operators";
import {PromptConfigDialogComponent} from "./prompt-config-dialog.component";
import {PromptConfigDialogConfig} from "./prompt-config-dialog.config";

@Injectable({providedIn: 'root'})
export class PromptConfigDialogService {
  constructor(private readonly dialog: MatDialog) {
  }

  open(cb: (saved: boolean | undefined) => void) {
    let alive = true;
    const config = new PromptConfigDialogConfig();
    return this.dialog
      .open<PromptConfigDialogComponent, any, boolean | undefined>(PromptConfigDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(res => {
        alive = false;
        cb(res);
      });
  }
}