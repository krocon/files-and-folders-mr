import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {FnfConfirmationDialogComponent} from './fnf-confirmation-dialog.component';
import {ConfirmationDialogData} from '@fnf-data';
import {Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class FnfConfirmationDialogService {
  constructor(private dialog: MatDialog) {}

  simpleConfirm(title: string, message: string, onConfirm: () => void): Promise<boolean> {
    const dialogRef = this.dialog.open(FnfConfirmationDialogComponent, {
      width: '400px',
      data: new ConfirmationDialogData(title, message)
    });

    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          onConfirm();
        }
        resolve(!!result);
      });
    });
  }

  showInfo(messages: string[]): Observable<any> {
    const dialogRef = this.dialog.open(FnfConfirmationDialogComponent, {
      width: '400px',
      data: new ConfirmationDialogData('Information', messages)
    });

    return dialogRef.afterClosed();
  }
}