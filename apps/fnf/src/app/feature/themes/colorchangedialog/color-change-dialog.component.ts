import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {ColorService} from '../service/color.service';
import {ThemeTableRow} from '../theme-table-row.model';
import {ColorChangeDialogResult} from "./color-change-dialog.result";
import {ColorChangeDialogData} from "./color-change-dialog.data";

@Component({
  selector: 'app-color-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatButton,
    MatIconModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatSlider,
    MatSliderThumb
  ],
  templateUrl: './color-change-dialog.component.html',
  styleUrls: ['./color-change-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorChangeDialogComponent {

  originalRows: ThemeTableRow[];
  workingRows: ThemeTableRow[];

  // controls (defaults set to no-op so nothing changes until user interacts)
  invertEnabled: boolean = false;
  lightnessDelta: number = 0; // -100..100 (negative = darker, positive = brighter)
  transparency: number = 0; // 0..100
  mergeColor: string = '#ffffff';
  mergeRatio: number = 0; // 0..1 (0 means disabled/no effect)
  mergeMode: 'alpha' | 'additive' | 'average' = 'alpha';
  blendColor: string = '#000000';
  blendAlpha: number = 0; // 0..1 (0 means disabled/no effect)

  private themeTableData: ThemeTableRow[];

  constructor(
    public dialogRef: MatDialogRef<ColorChangeDialogComponent, ColorChangeDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: ColorChangeDialogData,
    private readonly colorService: ColorService,
  ) {
    this.themeTableData = data.themeTableData;
    this.originalRows = [...(data.rows || [])].map(r => ({...r}));
    this.workingRows = this.originalRows.map(r => ({...r}));
  }


  // Central recompute based on current controls applied to originalRows
  recompute(): void {
    const transformed =
      this.originalRows
        .map((orig) => {
          let c = orig.value;
          if (c.startsWith('var(')) {
            c = this.getColorByVar(c);
          }

          if (this.invertEnabled) {
            c = this.colorService.invertCssColor(c);
          }

          if (this.lightnessDelta !== 0) {
            c = this.lightnessDelta > 0
              ? this.colorService.brighter(c, this.lightnessDelta)
              : this.colorService.darker(c, -this.lightnessDelta);
          }

          if (this.transparency > 0) {
            c = this.colorService.transparent(c, this.transparency);
          }

          if (this.mergeRatio > 0) {
            c = this.colorService.mergeColors(c, this.mergeColor, this.mergeRatio, this.mergeMode);
          }

          if (this.blendAlpha > 0) {
            c = this.colorService.blendColorsAlpha(c, this.blendColor, this.blendAlpha);
          }

          return {...orig, value: c};
        });

    this.workingRows = transformed;
    // Emit:
    this.data.onChange?.(this.workingRows);
  }


  applyInvert(): void {
    this.invertEnabled = !this.invertEnabled;
    this.recompute();
  }

  applyMerge(): void {
    this.recompute();
  }

  onReset(): void {
    // Reset all controls and preview
    this.invertEnabled = false;
    this.lightnessDelta = 0;
    this.transparency = 0;
    this.mergeRatio = 0;
    this.mergeColor = '#ffffff';
    this.mergeMode = 'alpha';
    this.blendAlpha = 0;
    this.blendColor = '#000000';
    this.workingRows = this.originalRows.map(r => ({...r}));
    // Emit:
    this.data.onChange?.(this.workingRows);
  }

  onApply(): void {
    this.recompute();
    this.dialogRef.close({rows: this.workingRows});
  }

  private getColorByVar(varStr: string, loop: number = 0): string {
    const key = varStr.replace('var(', '').replace(')', '');
    const value = this.themeTableData.filter(row => row.key === key)[0]?.value || '';
    if (value.startsWith('var(')) {
      if (loop > 10) {
        return '#ffffff';
      }
      return this.getColorByVar(value, (loop + 1));
    }
    return value;
  }
}
