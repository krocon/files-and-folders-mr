import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {DownloadDialogComponent} from "./download-dialog.component";
import {DownloadDialogData, DownloadDialogResultData} from "@fnf-data";

@Injectable({
  providedIn: 'root'
})
export class DownloadDialogService {

  constructor(private readonly dialog: MatDialog) {
  }

  open(data: DownloadDialogData, callback: (result: DownloadDialogResultData | undefined) => void): void {
    const dialogRef = this.dialog.open(DownloadDialogComponent, {
      data: data,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(callback);
  }
} 