import {Injectable} from "@angular/core";
import {GroupFilesDialogData} from "./data/group-files-dialog.data";
import {GroupFilesDialogComponent} from "./group-files-dialog.component";
import {takeWhile} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {GroupFilesDialogConfig} from "./group-files-dialog.config";
import {QueueActionEvent} from "../../task/domain/queue-action-event";
import {TypedDataService} from "../../../common/typed-data.service";
import {GroupFilesData} from "./data/group-files.data";
import {GroupFileDialogResponse} from "./data/group-file-dialog-response";

@Injectable({
  providedIn: "root"
})
export class GroupFilesDialogService {

  private readonly innerService = new TypedDataService<GroupFilesData>("group-files-dlg-pattern", new GroupFilesData());

  constructor(
    public readonly dialog: MatDialog
  ) {
  }


  public open(data: GroupFilesDialogData, cb: (target: GroupFileDialogResponse | undefined) => void) {

    data.data = this.innerService.getValue();
    let alive = true;
    const config = new GroupFilesDialogConfig(data);

    return this.dialog
      .open<GroupFilesDialogComponent, GroupFilesDialogData, GroupFileDialogResponse | undefined>(GroupFilesDialogComponent, config)
      .afterClosed()
      .pipe(takeWhile(() => alive))
      .subscribe(item => {
        alive = false;
        if (item) {
          this.innerService.update(item.groupFilesData);
        }
        cb(item);
      });
  }

}
