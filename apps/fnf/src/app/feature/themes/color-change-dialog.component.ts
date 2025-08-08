import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect, MatSelectChange} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {ColorService} from './color.service';

export interface ColorChangeDialogData {
  color: string;
  onChange?: (color: string) => void;
}

export interface ColorChangeDialogResult {
  color: string;
}

@Component({
  selector: 'app-color-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
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

  originalColor: string;
  workingColor: string;

  // controls (defaults set to no-op so nothing changes until user interacts)
  invertEnabled: boolean = false;
  lightnessDelta: number = 0; // -100..100 (negative = darker, positive = brighter)
  transparency: number = 0; // 0..100
  mergeColor: string = '#ffffff';
  mergeRatio: number = 0; // 0..1 (0 means disabled/no effect)
  mergeMode: 'alpha' | 'additive' | 'average' = 'alpha';
  blendColor: string = '#000000';
  blendAlpha: number = 0; // 0..1 (0 means disabled/no effect)

  constructor(
    public dialogRef: MatDialogRef<ColorChangeDialogComponent, ColorChangeDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: ColorChangeDialogData,
    private readonly colorService: ColorService,
  ) {
    this.originalColor = data.color;
    this.workingColor = data.color;
  }

  // Central recompute based on current controls applied to originalColor
  recompute(): void {
    let c = this.originalColor;

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

    this.workingColor = c;
    // Emit the change immediately if a callback is provided
    this.data.onChange?.(this.workingColor);
  }

  // Actions for compatibility and quick toggles
  applyInvert(): void {
    this.invertEnabled = !this.invertEnabled;
    this.recompute();
  }

  applyMerge(): void {
    // No separate apply button in UI anymore, but keep method for tests/compatibility
    this.recompute();
  }

  applyBrighter(): void {
    // Deprecated in UI (replaced by single slider). Kept for compatibility/tests.
    this.lightnessDelta = Math.abs(this.lightnessDelta || 0);
    this.recompute();
  }

  applyDarker(): void {
    // Deprecated in UI (replaced by single slider). Kept for compatibility/tests.
    this.lightnessDelta = -Math.abs(this.lightnessDelta || 0);
    this.recompute();
  }

  applyTransparent(): void {
    // Transparency taken from this.transparency via slider
    this.recompute();
  }

  applyBlend(): void {
    // Blend parameters taken from this.blendColor and this.blendAlpha via UI
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
    this.workingColor = this.originalColor;
    // Emit reset color immediately
    this.data.onChange?.(this.workingColor);
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  onApply(): void {
    // Ensure latest settings are reflected
    this.recompute();
    this.dialogRef.close({color: this.workingColor});
  }
}
