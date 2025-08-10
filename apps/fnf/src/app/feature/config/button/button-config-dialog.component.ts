import {ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {FnfEditorComponent} from '../../common/editor/fnf-editor.component';
import {FnfEditorOptions} from '../../common/editor/data/fnf-editor-options.interface';
import {ButtonMapping, ConfigButtonsService} from '../../../service/config/config-buttons.service';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'fnf-button-config-dialog',
  templateUrl: './button-config-dialog.component.html',
  styleUrls: ['./button-config-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIconModule,
    FnfEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonConfigDialogComponent implements OnInit, OnDestroy {

  editorText = '';
  isValidJson = true;
  loading = false;
  editorOptions: Partial<FnfEditorOptions> = {language: 'json', wordWrap: 'on', minimap: false};

  private alive = true;
  private original?: ButtonMapping;

  constructor(
    private readonly dialogRef: MatDialogRef<ButtonConfigDialogComponent, boolean>,
    private readonly configButtonsService: ConfigButtonsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit(): void {
    this.loading = true;
    this.configButtonsService
      .apiUrlButtons()
      .pipe(takeWhile(() => this.alive))
      .subscribe(mapping => {
        this.original = mapping;
        this.editorText = JSON.stringify(mapping, null, 2);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  onEditorChange(txt: string) {
    this.editorText = txt;
    this.isValidJson = this.validateJson(txt);
  }

  onReset() {
    this.loading = true;
    this.configButtonsService
      .getDefaults()
      .pipe(takeWhile(() => this.alive))
      .subscribe(mapping => {
        this.editorText = JSON.stringify(mapping, null, 2);
        this.isValidJson = true;
        this.loading = false;
      });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onSave() {
    if (!this.isValidJson) return;
    try {
      const parsed = JSON.parse(this.editorText) as ButtonMapping;
      this.loading = true;
      this.configButtonsService
        .saveButtons(parsed)
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
}
