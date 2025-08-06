import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Subject, takeUntil} from 'rxjs';
import {ColorDataIf} from '@fnf-data';
import {ConfigThemesService} from '../../service/config/config-themes.service';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {ColorPickerDirective} from 'ngx-color-picker';

interface ThemeTableRow {
  selected: boolean;
  key: string;
  value: string;
}

@Component({
  selector: 'app-themes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    ColorPickerDirective
  ],
  templateUrl: './themes.component.html',
  styleUrls: ['./themes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  themeForm: FormGroup;
  themeDefaultNames: string[] = [];
  selectedTheme: ColorDataIf | null = null;
  themeTableData: ThemeTableRow[] = [];
  filteredTableData: ThemeTableRow[] = [];
  isLoading = false;
  isSaving = false;
  presetColors: string[] = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#008000', '#800000', '#000080', '#808080', '#c0c0c0'
  ];

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly configThemesService: ConfigThemesService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.themeForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadDefaultThemeNames();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      selectedThemeName: [''],
      tableFilter: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Subscribe to theme selection changes
    this.themeForm.get('selectedThemeName')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(themeName => {
        if (themeName) {
          this.loadTheme(themeName);
        }
      });

    // Subscribe to filter changes
    this.themeForm.get('tableFilter')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(filterValue => {
        this.applyTableFilter(filterValue || '');
      });
  }

  private loadDefaultThemeNames(): void {
    this.configThemesService
      .loadDefaultNames()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (names) => {
          this.themeDefaultNames = names;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading theme names:', error);
        }
      });
  }

  private loadTheme(themeName: string): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.configThemesService
      .loadTheme(themeName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (theme) => {
          this.selectedTheme = theme;
          this.prepareTableData();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading theme:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private prepareTableData(): void {
    console.info('this.selectedTheme', this.selectedTheme); // TODO del

    if (!this.selectedTheme) {
      return;
    }

    this.themeTableData = Object.entries(this.selectedTheme.colors).map(([key, value]) => ({
      selected: false,
      key,
      value
    }));
    console.info('this.themeTableData', this.themeTableData); // TODO del
    this.applyTableFilter(this.themeForm.get('tableFilter')?.value || '');
  }

  private applyTableFilter(filterValue: string): void {
    if (!filterValue.trim()) {
      this.filteredTableData = [...this.themeTableData];
    } else {
      const filter = filterValue.toLowerCase();
      this.filteredTableData = this.themeTableData.filter(row =>
        row.key.toLowerCase().includes(filter) ||
        row.value.toLowerCase().includes(filter)
      );
    }
    console.info('this.filteredTableData', this.filteredTableData); // TODO del
    this.cdr.detectChanges();
  }

  onRowSelectionChange(index: number, selected: boolean): void {
    if (index >= 0 && index < this.filteredTableData.length) {
      this.filteredTableData[index].selected = selected;

      // Update the original data as well
      const originalIndex = this.themeTableData.findIndex(row =>
        row.key === this.filteredTableData[index].key
      );
      if (originalIndex >= 0) {
        this.themeTableData[originalIndex].selected = selected;
      }

      this.cdr.detectChanges();
    }
  }

  onColorChange(index: number, color: string): void {
    if (index >= 0 && index < this.filteredTableData.length) {
      this.filteredTableData[index].value = color;
      this.updateOriginalData(index, color);
    }
  }

  onValueChange(index: number, value: string): void {
    if (index >= 0 && index < this.filteredTableData.length) {
      this.filteredTableData[index].value = value;
      this.updateOriginalData(index, value);
    }
  }

  private updateOriginalData(filteredIndex: number, value: string): void {
    const key = this.filteredTableData[filteredIndex].key;
    const originalIndex = this.themeTableData.findIndex(row => row.key === key);

    if (originalIndex >= 0) {
      this.themeTableData[originalIndex].value = value;

      // Update the selectedTheme data as well
      if (this.selectedTheme) {
        this.selectedTheme.colors[key] = value;
      }
    }

    this.cdr.detectChanges();
  }

  isColorValue(value: string): boolean {
    // Check if the value looks like a color (hex, rgb, rgba, hsl, hsla, or named colors)
    const colorRegex = /^(#[0-9a-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|var\(--.*-color\)|transparent|inherit|initial|unset)$/i;
    const namedColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey'];

    return colorRegex.test(value.trim()) || namedColors.includes(value.trim().toLowerCase());
  }

  getColorPreview(value: string): string {
    // If it's a CSS variable, return a default color for preview
    if (value.startsWith('var(')) {
      return '#cccccc';
    }

    // If it's a valid CSS color, return it
    if (this.isColorValue(value)) {
      return value;
    }

    // Default fallback
    return '#ffffff';
  }

  onApply(): void {
    if (!this.selectedTheme) {
      return;
    }

    // TODO: Implement apply functionality
    // This will be implemented later as mentioned in the issue description
    console.log('Apply theme changes:', this.selectedTheme);
  }

  onCancel(): void {
    this.navigateToFiles();
  }

  private navigateToFiles(): void {
    this.router.navigate(['/files']);
  }
}