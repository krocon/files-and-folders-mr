import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ColorPickerDirective} from 'ngx-color-picker';
import {ColorService} from './color.service';
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
  @Input() key: string = '';
  // Value is an array; first element is visualized, outputs mirror the input length
  @Input() value: string[] = [];
  @Input() presetColors: string[] = [];
  @Input() themeTableData: any[] = [];

  @Output() valueChange = new EventEmitter<string[]>();
  @Output() colorChange = new EventEmitter<string[]>();

  constructor(private readonly colorService: ColorService, private readonly dialog: MatDialog) {
  }

  openColorChangeDialog(): void {
    const firstColor = this.getFirstColor();
    const initialColor = this.getColorPreview(firstColor);

    // pass current array of values (or a single item) to the dialog
    const colorsForDialog: string[] = (this.value && this.value.length > 0)
      ? [...this.value]
      : [initialColor];

    const dialogRef = this.dialog.open<ColorChangeDialogComponent, ColorChangeDialogData, ColorChangeDialogResult>(
      ColorChangeDialogComponent,
      {
        data: {
          colors: colorsForDialog,
          onChange: (cs: string[]) => this.onColorArrayChange(cs)
        }
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.colors && result.colors.length > 0) {
        this.onColorArrayChange(result.colors);
      }
    });
  }

  // Exposed for template change of text input
  onValueChangeSingle(val: string): void {
    const len = Math.max(1, this.value?.length || 0);
    const arr = new Array(len).fill(val);
    this.value = arr;
    this.valueChange.emit(arr);
  }

  // Programmatic color changes from picker or dialog
  onColorArrayChange(colors: string[]): void {
    const len = Math.max(1, this.value?.length || 0);
    // Ensure emitted array length equals current input length
    const arr = (colors && colors.length)
      ? colors.slice(0, len).concat(new Array(Math.max(0, len - colors.length)).fill(colors[0]))
      : new Array(len).fill(this.firstValue());
    this.value = arr;
    this.colorChange.emit(arr);
  }

  endsWith(key: string | undefined, suffix: string): boolean {
    if (!key) {
      return false;
    }
    return key.endsWith(suffix);
  }

  isColorValue(v: string): boolean {
    return this.colorService.isColorValue(v);
  }

  private getColorValue(key: string): string {
    return this.themeTableData.filter(row => row.key === key)[0]?.value || '';
  }

  private firstValue(): string {
    return (this.value && this.value.length > 0) ? this.value[0] : '';
  }

  // Returns the first color considering the value array
  private getFirstColor(): string {
    return this.firstValue();
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
}