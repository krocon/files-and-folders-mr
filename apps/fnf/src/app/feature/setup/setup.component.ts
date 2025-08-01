import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Subject, takeUntil} from 'rxjs';
import {SetupData} from '@fnf-data';
import {SetupDataService} from './setup-data.service';
import {SetupPersistentService} from './setup-persistent.service';
import {FnfConfirmationDialogService} from '../../common/confirmationdialog/fnf-confirmation-dialog.service';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule
  ],
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  setupForm: FormGroup;
  isLoading = false;
  isSaving = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private setupDataService: SetupDataService,
    private setupPersistentService: SetupPersistentService,
    private confirmationDialogService: FnfConfirmationDialogService
  ) {
    this.setupForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadSetupData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      openAboutInNewWindow: [false],
      openSetupInNewWindow: [false],
      openServerShellInNewWindow: [true],
      openManageShortcutsInNewWindow: [true],
      loadFolderSizeAfterSelection: [false],
      condensedPresentationStyle: [false]
    });
  }

  private loadSetupData(): void {
    this.isLoading = true;

    this.setupDataService.getCurrentData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (setupData: SetupData) => {
          this.setupForm.patchValue({
            openAboutInNewWindow: setupData.openAboutInNewWindow,
            openSetupInNewWindow: setupData.openSetupInNewWindow,
            openServerShellInNewWindow: setupData.openServerShellInNewWindow,
            openManageShortcutsInNewWindow: setupData.openManageShortcutsInNewWindow,
            loadFolderSizeAfterSelection: setupData.loadFolderSizeAfterSelection,
            condensedPresentationStyle: setupData.condensedPresentationStyle
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading setup data:', error);
          this.isLoading = false;
        }
      });
  }

  onSave(): void {
    if (this.setupForm.valid && !this.isSaving) {
      this.isSaving = true;

      const formValue = this.setupForm.value;
      const setupData = new SetupData(
        formValue.openAboutInNewWindow,
        formValue.openSetupInNewWindow,
        formValue.openServerShellInNewWindow,
        formValue.openManageShortcutsInNewWindow,
        formValue.loadFolderSizeAfterSelection,
        formValue.condensedPresentationStyle
      );

      this.setupPersistentService.saveSetupData(setupData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.setupDataService.updateData(setupData);
              this.navigateToFiles();
            } else {
              console.error('Failed to save setup data:', response.message);
              this.isSaving = false;
            }
          },
          error: (error) => {
            console.error('Error saving setup data:', error);
            this.isSaving = false;
          }
        });
    }
  }

  onCancel(): void {
    this.navigateToFiles();
  }

  onClose(): void {
    this.navigateToFiles();
  }

  onClearLocalStorage(): void {
    this.confirmationDialogService.simpleConfirm(
      'Clear Local Storage',
      'Do you really want to clear all local storage data? This action cannot be undone.',
      () => {
        try {
          localStorage.clear();
          console.log('Local storage cleared successfully');
        } catch (error) {
          console.error('Error clearing local storage:', error);
        }
      }
    );
  }

  private navigateToFiles(): void {
    this.router.navigate(['/files']);
  }
}