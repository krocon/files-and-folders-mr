import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ColorPickerDirective} from 'ngx-color-picker';
import {ColorService} from './color.service';
import {ThemeTableRow} from './theme-table-row.model';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {
  ColorChangeDialogComponent,
  ColorChangeDialogData,
  ColorChangeDialogResult
} from './color-change-dialog.component';


@Component({
  selector: 'app-css-variable-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ColorPickerDirective,
    MatIconModule,
    MatIconButton
  ],
  templateUrl: './css-variable-editor.component.html',
  styleUrls: ['./css-variable-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CssVariableEditorComponent {

  @Input() cpPosition: string = 'bottom';
  // Value is an array of ThemeTableRow; first row is visualized for single-row editor
  @Input() value: ThemeTableRow[] = [];
  @Input() presetColors: string[] = [];
  @Input() themeTableData: ThemeTableRow[] = [];

  @Output() valueChange = new EventEmitter<ThemeTableRow[]>();
  @Output() colorChange = new EventEmitter<ThemeTableRow[]>();

  constructor(private readonly colorService: ColorService, private readonly dialog: MatDialog) {
  }

  openColorChangeDialog(): void {
    const firstColor = this.getFirstColor();
    const initialColor = this.getColorPreview(firstColor);

    // Prepare rows for dialog; if none, synthesize a single row-like entry is not feasible; skip
    const rowsForDialog: ThemeTableRow[] = (this.value && this.value.length > 0)
      ? this.value.map(r => ({...r}))
      : [];

    const dialogRef = this.dialog.open<ColorChangeDialogComponent, ColorChangeDialogData, ColorChangeDialogResult>(
      ColorChangeDialogComponent,
      {
        data: {
          rows: rowsForDialog,
          onChange: (rows: ThemeTableRow[]) => this.onColorRowsChange(rows)
        }
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.rows && result.rows.length > 0) {
        this.onColorRowsChange(result.rows);
      }
    });
  }

  // Exposed for template change of text input
  onValueChangeSingle(val: string): void {
    const len = Math.max(1, this.value?.length || 0);
    const updated: ThemeTableRow[] = [];
    for (let i = 0; i < len; i++) {
      const base = this.value && this.value[i] ? this.value[i] : (this.value && this.value[0] ? this.value[0] : {
        selected: false,
        key: '',
        value: ''
      });
      updated.push({...base, value: val});
    }
    this.value = updated;
    this.valueChange.emit(updated);
  }

  // Programmatic color changes from picker (string[]) or dialog (rows)
  onColorArrayChange(colors: string[]): void {
    const len = Math.max(1, this.value?.length || 0);
    const arr = (colors && colors.length)
      ? colors.slice(0, len).concat(new Array(Math.max(0, len - colors.length)).fill(colors[0]))
      : new Array(len).fill(this.firstValueStr());
    const updated: ThemeTableRow[] = [];
    for (let i = 0; i < len; i++) {
      const base = this.value && this.value[i] ? this.value[i] : (this.value && this.value[0] ? this.value[0] : {
        selected: false,
        key: '',
        value: ''
      });
      updated.push({...base, value: arr[i]});
    }
    this.value = updated;
    this.colorChange.emit(updated);
  }

  onColorRowsChange(rows: ThemeTableRow[]): void {
    // Normalize to current length
    const len = Math.max(1, this.value?.length || 0);
    const src = rows && rows.length ? rows : (this.value || []);
    const updated: ThemeTableRow[] = [];
    for (let i = 0; i < len; i++) {
      const base = this.value && this.value[i] ? this.value[i] : (this.value && this.value[0] ? this.value[0] : {
        selected: false,
        key: '',
        value: ''
      });
      const srcRow = src.length ? (i < src.length ? src[i] : src[0]) : base;
      updated.push({...base, value: srcRow.value});
    }
    this.value = updated;
    this.colorChange.emit(updated);
  }

  endsWithKey(suffix: string): boolean {
    const key = this.value && this.value.length ? this.value[0].key : undefined;
    if (!key) {
      return false;
    }
    return key.endsWith(suffix);
  }

  isColorValue(v: string): boolean {
    return this.colorService.isColorValue(v);
  }

  getColorPreview(value: string, loop: number = 0): string {
    // If it's a CSS variable, return a default color for preview
    if (value.startsWith('var(')) {
      if (loop > 10) {
        return '#ffffff';
      }
      const key = value.replace('var(', '').replace(')', '');
      return this.getColorPreview(this.getColorValue(key), loop + 1);
    }

    return value;
  }

  private getColorValue(key: string): string {
    return this.themeTableData.filter(row => row.key === key)[0]?.value || '';
  }

  private firstValueStr(): string {
    return (this.value && this.value.length > 0) ? this.value[0].value : '';
  }

  // Returns the first color considering the value array
  private getFirstColor(): string {
    return this.firstValueStr();
  }
}