import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {CommonModule} from '@angular/common';
import {FnfEditorComponent} from '../../common/editor/fnf-editor.component';
import {FnfEditorOptions} from '../../common/editor/data/fnf-editor-options.interface';
import {takeWhile} from 'rxjs/operators';
import {ConfigToolsService} from '../../../service/config/config-tools.service';
import {BrowserOsService} from '../../../service/browseros/browser-os.service';
import {BrowserOsType, ToolData} from '@fnf-data';

@Component({
  selector: 'fnf-tool-config-dialog',
  templateUrl: './tool-config-dialog.component.html',
  styleUrls: ['./tool-config-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    FnfEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolConfigDialogComponent implements OnInit, OnDestroy {

  editorText = '';
  isValidJson = true;
  loading = false;
  selectedOsType: BrowserOsType = 'osx';
  editorOptions: Partial<FnfEditorOptions> = {
    theme: 'vs',
    language: 'json',
    wordWrap: 'on',
    minimap: false
  };

  private alive = true;
  private original?: ToolData;

  constructor(
    private readonly dialogRef: MatDialogRef<ToolConfigDialogComponent, boolean>,
    private readonly configToolsService: ConfigToolsService,
    private readonly browserOsService: BrowserOsService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit(): void {
    this.selectedOsType = this.browserOsService.browserOs;
    this.loadToolsForOsType(this.selectedOsType);
  }

  onOsTypeChange(event: any): void {
    this.selectedOsType = event.value;
    this.loadToolsForOsType(this.selectedOsType);
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  onEditorChange(txt: string) {
    this.editorText = txt;
    this.isValidJson = this.validateJson(txt);
    this.cdr.markForCheck();
  }

  private loadToolsForOsType(osType: BrowserOsType): void {
    this.loading = true;
    this.configToolsService
      .getTools(osType)
      .pipe(takeWhile(() => this.alive))
      .subscribe({
        next: (mapping) => {
          this.original = mapping;
          this.setEditorFromMapping(mapping);
        },
        error: () => this.loadDefaultsToEditor(),
      });
  }

  onReset() {
    this.loading = true;
    this.loadDefaultsToEditor();
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onSave() {
    if (!this.isValidJson) return;
    try {
      const parsed = JSON.parse(this.editorText) as ToolData;
      this.loading = true;
      this.configToolsService
        .saveTools(this.selectedOsType, parsed)
        .pipe(takeWhile(() => this.alive))
        .subscribe(() => {
          this.loading = false;
          this.dialogRef.close(true);
        });
    } catch {
      this.isValidJson = false;
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

  private setEditorFromMapping(mapping: ToolData) {
    this.editorText = JSON.stringify(mapping, null, 2);
    this.isValidJson = true;
    this.loading = false;
    this.cdr.markForCheck();
  }

  private loadDefaultsToEditor() {
    this.configToolsService
      .getDefaults(this.selectedOsType)
      .pipe(takeWhile(() => this.alive))
      .subscribe({
        next: (mapping) => this.setEditorFromMapping(mapping),
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
