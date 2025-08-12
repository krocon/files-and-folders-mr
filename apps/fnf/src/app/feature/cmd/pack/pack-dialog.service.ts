import {Injectable} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {PackDialogComponent} from "./pack-dialog.component";
import {PackDialogData, PackDialogResultData} from "@fnf-data";

@Injectable({
  providedIn: 'root'
})
export class PackDialogService {

  constructor(private readonly dialog: MatDialog) {
  }

  open(data: PackDialogData, callback: (result: PackDialogResultData | undefined) => void): void {
    const dialogRef = this.dialog.open(PackDialogComponent, {
      data: data,
      width: '600px',
      panelClass: "fnf-dialog-primary"
    });

    dialogRef.afterClosed().subscribe(callback);
  }
} 