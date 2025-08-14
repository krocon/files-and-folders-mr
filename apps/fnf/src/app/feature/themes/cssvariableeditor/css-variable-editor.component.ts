import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ColorService} from '../service/color.service';
import {ThemeTableRow} from '../theme-table-row.model';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {ColorChangeDialogComponent} from '../colorchangedialog/color-change-dialog.component';
import {ColorChangeDialogResult} from "../colorchangedialog/color-change-dialog.result";
import {ColorChangeDialogData} from "../colorchangedialog/color-change-dialog.data";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";


@Component({
  selector: 'app-css-variable-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  templateUrl: './css-variable-editor.component.html',
  styleUrls: ['./css-variable-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CssVariableEditorComponent {

  @Input() cpPosition: string = 'bottom';
  @Input() rows: ThemeTableRow[] = [];
  @Input() presetColors: string[] = [];
  @Input() allThemeTableData: ThemeTableRow[] = [];
  @Output() valueChange = new EventEmitter<ThemeTableRow[]>();
  @Output() colorChange = new EventEmitter<ThemeTableRow[]>();

  /**
   * Returns an inverted color string for the given CSS variable key (e.g. '--primary-color').
   * It resolves var() chains using the theme table data and then applies inversion via ColorService.
   * If resolution or inversion fails, returns '#000000' as a safe fallback.
   */
  getInvertedColorForVarKey(key: string): string {
    if (!key) {
      return '#000000';
    }
    try {
      const raw = this.getColorValue(key) || '';
      const resolved = raw ? this.getColorPreview(raw) : '';
      const inverted = resolved ? this.colorService.invertCssColor(resolved) : '';
      // Fallbacks
      return (inverted && this.colorService.isColorValue(inverted)) ? inverted : '#000000';
    } catch {
      return '#000000';
    }
  }

  constructor(
    private readonly colorService: ColorService,
    private readonly dialog: MatDialog) {
  }

  private _refresh: number = 0;

  get refresh(): number {
    return this._refresh;
  }

  @Input()
  set refresh(value: number) {
    this._refresh = value;
  }

  openColorChangeDialog(): void {
    // Prepare rows for dialog; if none, synthesize a single row-like entry is not feasible; skip
    const rowsForDialog: ThemeTableRow[] = (this.rows && this.rows.length > 0)
      ? this.rows.map(r => ({...r}))
      : [];

    const dialogRef =
      this.dialog.open<ColorChangeDialogComponent, ColorChangeDialogData, ColorChangeDialogResult>(
        ColorChangeDialogComponent,
        {
          minWidth: '600px',
          width: '700px',
          maxWidth: '100vW',
          maxHeight: '100vH',
          data: {
            rows: rowsForDialog,
            onChange: (rows: ThemeTableRow[]) => this.onColorRowsChange(rows),
            themeTableData: this.allThemeTableData
          }
        }
      );
    dialogRef
      .afterClosed()
      .subscribe(result => {
        if (result && result.rows && result.rows.length > 0) {
          this.onColorRowsChange(result.rows);
        }
      });
  }

  // Exposed for template change of text input
  onValueChangeSingle(val: string): void {
    const len = Math.max(1, this.rows?.length || 0);
    const updated: ThemeTableRow[] = [];
    for (let i = 0; i < len; i++) {
      const base = this.rows && this.rows[i] ? this.rows[i] : (this.rows && this.rows[0] ? this.rows[0] : {
        selected: false,
        key: '',
        value: ''
      });
      updated.push({...base, value: val});
    }
    this.rows = updated;
    this.valueChange.emit(updated);
  }

  // onColorArrayChange(colors: string[]): void {
  //   const len = Math.max(1, this.rows?.length || 0);
  //   const arr = (colors && colors.length)
  //     ? colors.slice(0, len).concat(new Array(Math.max(0, len - colors.length)).fill(colors[0]))
  //     : new Array(len).fill(this.firstValueStr());
  //   const updated: ThemeTableRow[] = [];
  //   for (let i = 0; i < len; i++) {
  //     const base = this.rows && this.rows[i] ? this.rows[i] : (this.rows && this.rows[0] ? this.rows[0] : {
  //       selected: false,
  //       key: '',
  //       value: ''
  //     });
  //     updated.push({...base, value: arr[i]});
  //   }
  //   this.rows = updated;
  //   this.colorChange.emit(updated);
  // }

  onColorRowsChange(rows: ThemeTableRow[]): void {
    // Normalize to current length
    const len = Math.max(1, this.rows?.length || 0);
    const src = rows && rows.length ? rows : (this.rows || []);
    const updated: ThemeTableRow[] = [];
    for (let i = 0; i < len; i++) {
      const base = this.rows && this.rows[i] ? this.rows[i] : (this.rows && this.rows[0] ? this.rows[0] : {
        selected: false,
        key: '',
        value: ''
      });
      const srcRow = src.length ? (i < src.length ? src[i] : src[0]) : base;
      updated.push({...base, value: srcRow.value});
    }
    this.rows = updated;
    this.colorChange.emit(updated);
  }

  endsWithKey(suffix: string): boolean {
    const key = this.rows && this.rows.length ? this.rows[0]?.key : undefined;
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

  onMenuItemClicked(item: string) {
    this.onValueChangeSingle(item);
  }

  private getColorValue(key: string): string {
    return this.allThemeTableData.filter(row => row.key === key)[0]?.value || '';
  }

  // private firstValueStr(): string {
  //   return (this.rows && this.rows.length > 0) ? this.rows[0].value : '';
  // }
}