import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ColorPickerDirective} from 'ngx-color-picker';
import {ColorService} from './color.service';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {ColorChangeDialogComponent} from './color-change-dialog.component';

/*
Extend CssVariableEditorComponent with icon button 'tune' to open a new color change dialog with these functions from ColorService:
  - invertCssColor
  - brighter
  - darker
  - transparent
  - mergeColors
  - blendColorsAlpha
Rules: .junie/instructions_angular.md
 */



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
  @Input() value: string = '';
  @Input() presetColors: string[] = [];
  @Input() themeTableData: any[] = [];

  @Output() valueChange = new EventEmitter<string>();
  @Output() colorChange = new EventEmitter<string>();

  constructor(private readonly colorService: ColorService, private readonly dialog: MatDialog) {
  }

  openColorChangeDialog(): void {
    const initialColor = this.getColorPreview(this.value);
    const dialogRef = this.dialog.open<ColorChangeDialogComponent, { color: string }, {
      color: string
    }>(ColorChangeDialogComponent, {
      data: {color: initialColor}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.color) {
        this.onColorChange(result.color);
      }
    });
  }

  onValueChange(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }

  onColorChange(color: string): void {
    this.value = color;
    this.colorChange.emit(color);
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