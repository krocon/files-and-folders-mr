import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FnfEditorComponent} from '../../common/editor/fnf-editor.component';
import {FnfEditorOptions} from '../../common/editor/data/fnf-editor-options.interface';
import {takeWhile} from 'rxjs/operators';
import {ConfigThemesService} from '../../../service/config/config-themes.service';
import {ColorDataIf} from '@fnf-data';
import {forkJoin} from 'rxjs';
import {FnfConfirmationDialogService} from '../../../common/confirmationdialog/fnf-confirmation-dialog.service';

@Component({
  selector: 'fnf-theme-config-dialog',
  templateUrl: './theme-config-dialog.component.html',
  styleUrls: ['./theme-config-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    FnfEditorComponent,
    MatIconButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeConfigDialogComponent implements OnInit, OnDestroy {

  editorText = '';
  isValidJson = true;
  loading = false;
  selectedTheme = '';
  themeName = '';
  customThemes: string[] = [];
  predefinedThemes: string[] = [];
  allThemes: string[] = [];
  editorOptions: Partial<FnfEditorOptions> = {
    theme: 'vs',
    language: 'json',
    wordWrap: 'on',
    minimap: false
  };

  private alive = true;
  private original?: ColorDataIf;

  constructor(
    private readonly dialogRef: MatDialogRef<ThemeConfigDialogComponent, boolean>,
    private readonly configThemesService: ConfigThemesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly confirmationDialogService: FnfConfirmationDialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit(): void {
    this.loadThemeNames();
  }

  onThemeChange(event: any): void {
    this.selectedTheme = event.value;
    this.themeName = this.selectedTheme;
    this.loadThemeData(this.selectedTheme);
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  onEditorChange(txt: string) {
    this.editorText = txt;
    this.isValidJson = this.validateJson(txt);
    this.cdr.markForCheck();
  }

  get isPredefinedTheme(): boolean {
    return this.predefinedThemes.includes(this.selectedTheme);
  }

  get isThemeNamePredefined(): boolean {
    return this.predefinedThemes.includes(this.themeName.trim());
  }

  get canSave(): boolean {
    return this.isValidJson &&
      !this.isThemeNamePredefined &&
      this.themeName.trim() !== '';
  }

  onThemeNameChange(): void {
    this.updateJsonNameProperty();
    this.cdr.markForCheck();
  }

  private loadThemeNames(): void {
    this.loading = true;
    forkJoin({
      custom: this.configThemesService.loadCustomNames(),
      predefined: this.configThemesService.loadDefaultNames()
    })
      .pipe(takeWhile(() => this.alive))
      .subscribe({
        next: (result) => {
          this.customThemes = result.custom || [];
          this.predefinedThemes = result.predefined || [];
          this.allThemes = [...this.customThemes, ...this.predefinedThemes];
          if (this.allThemes.length > 0) {
            this.selectedTheme = this.allThemes[0];
            this.loadThemeData(this.selectedTheme);
          } else {
            this.loading = false;
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadThemeData(themeName: string): void {
    if (!themeName) return;

    this.loading = true;
    this.configThemesService
      .loadTheme(themeName)
      .pipe(takeWhile(() => this.alive))
      .subscribe({
        next: (themeData) => {
          this.original = themeData;
          this.setEditorFromThemeData(themeData);
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onReset() {
    if (this.original) {
      this.setEditorFromThemeData(this.original);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onSave() {
    if (!this.canSave) return;

    try {
      const parsed = JSON.parse(this.editorText) as ColorDataIf;
      // Ensure the name property in JSON matches the theme name input
      parsed.name = this.themeName.trim();
      this.loading = true;
      this.configThemesService
        .saveTheme(this.themeName.trim(), parsed)
        .pipe(takeWhile(() => this.alive))
        .subscribe({
          next: () => {
            this.loading = false;
            this.dialogRef.close(true);
          },
          error: () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
    } catch {
      this.isValidJson = false;
      this.cdr.markForCheck();
    }
  }

  private validateJson(txt: string): boolean {
    try {
      JSON.parse(txt);
      return true;
    } catch {
      return false;
    }
  }

  private updateJsonNameProperty(): void {
    if (!this.isValidJson) return;

    try {
      const parsed = JSON.parse(this.editorText) as ColorDataIf;
      parsed.name = this.themeName.trim();
      this.editorText = JSON.stringify(parsed, null, 2);
    } catch {
      // Ignore errors, JSON might be temporarily invalid
    }
  }

  private setEditorFromThemeData(themeData: ColorDataIf) {
    this.editorText = JSON.stringify(themeData, null, 2);
    this.themeName = themeData.name || '';
    this.isValidJson = true;
    this.loading = false;
    this.cdr.markForCheck();
  }

  isDeleteEnabled(): boolean {
    return this.customThemes.includes(this.selectedTheme) && this.selectedTheme.trim() !== '';
  }

  onDeleteTheme() {
    const name = this.selectedTheme?.trim();

    // Only allow deletion of custom themes
    if (!name || !this.isDeleteEnabled()) {
      return;
    }

    this.confirmationDialogService.simpleConfirm(
      'Delete', `Do you want to delete '${name}'?`,
      () => {
        this.loading = true;
        this.cdr.markForCheck();

        this.configThemesService.deleteTheme(name)
          .pipe(takeWhile(() => this.alive))
          .subscribe({
            next: () => {
              this.loading = false;
              // Choose a safe fallback theme (prefer first custom or predefined theme)
              const fallback = this.customThemes.length > 0 ? this.customThemes[0] :
                this.predefinedThemes.length > 0 ? this.predefinedThemes[0] : '';
              if (fallback) {
                this.selectedTheme = fallback;
                this.loadThemeData(fallback);
              }
              // Refresh known names after deletion
              this.loadThemeNames();
              this.cdr.markForCheck();
            },
            error: (error) => {
              console.error('Error deleting theme:', error);
              this.loading = false;
              this.cdr.markForCheck();
            }
          });
      });
  }
}