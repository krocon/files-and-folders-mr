import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {ConfirmationDialogData} from './data/confirmation-dialog.data';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'fnf-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton
  ],
  template: `
    <h2 mat-dialog-title>{{data.title}}</h2>
    <mat-dialog-content>
      <p style="white-space: pre-line">{{data.message}}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onYesClick()">Confirm</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      padding: 16px;
    }
    mat-dialog-content {
      min-width: 300px;
    }
    mat-dialog-actions {
      margin-bottom: 0;
    }
  `]
})
export class FnfConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FnfConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
