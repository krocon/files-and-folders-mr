import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {combineLatest, Subject, takeUntil} from 'rxjs';
import {ColorDataIf} from '@fnf-data';
import {ConfigThemesService} from '../../service/config/config-themes.service';
import {ColorService} from './color.service';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {ColorPickerDirective} from 'ngx-color-picker';
import {LookAndFeelService} from "./look-and-feel.service";

interface ThemeTableRow {
  selected: boolean;
  key: string;
  value: string;
}

interface FilterInterface {
  panels: {
    all: boolean;
    activepanel: boolean;
    inactivepanel: boolean;
  };
  areas: {
    all: boolean;
    header: boolean;
    table: boolean;
    footer: boolean;
    tooltip: boolean;
    errorPanel: boolean;
    material: boolean;
    scrollbar: boolean;
  };
  property: {
    all: boolean;
    fg: boolean;
    bg: boolean;
    border: boolean;
  };
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
  styleUrls: ['./themes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemesComponent implements OnInit, OnDestroy {

  themeForm: FormGroup;
  themeNames: string[] = [];
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
  private destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly configThemesService: ConfigThemesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly colorService: ColorService,
    private readonly lookAndFeelService: LookAndFeelService,
  ) {
    this.themeForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadThemeNames();
    this.setupFormSubscriptions();
    this.loadTheme(this.lookAndFeelService.getTheme());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  onAllCheckboxChange(groupName: 'panels' | 'areas' | 'property', checked: boolean): void {
    const group = this.themeForm.get(groupName) as FormGroup;
    if (!group) return;

    // Get all controls in the group except 'all'
    const controls = Object.keys(group.controls).filter(key => key !== 'all');

    // Set all checkboxes in the group to the same state as 'all'
    controls.forEach(controlName => {
      group.get(controlName)?.setValue(checked, {emitEvent: false});
    });

    this.applyFilters();
  }

  onIndividualCheckboxChange(groupName: 'panels' | 'areas' | 'property'): void {
    const group = this.themeForm.get(groupName) as FormGroup;
    if (!group) return;

    // Get all controls in the group except 'all'
    const controls = Object.keys(group.controls).filter(key => key !== 'all');
    const checkedCount = controls.filter(controlName =>
      group.get(controlName)?.value === true
    ).length;

    // Update 'all' checkbox state based on individual checkboxes
    const allControl = group.get('all');
    if (checkedCount === 0) {
      allControl?.setValue(false, {emitEvent: false});
    } else if (checkedCount === controls.length) {
      allControl?.setValue(true, {emitEvent: false});
    } else {
      // For semi-selected state, we'll use indeterminate property in template
      allControl?.setValue(false, {emitEvent: false});
    }

    this.applyFilters();
  }

  isIndeterminate(groupName: 'panels' | 'areas' | 'property'): boolean {
    const group = this.themeForm.get(groupName) as FormGroup;
    if (!group) return false;

    const controls = Object.keys(group.controls).filter(key => key !== 'all');
    const checkedCount = controls.filter(controlName =>
      group.get(controlName)?.value === true
    ).length;

    return checkedCount > 0 && checkedCount < controls.length;
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

  isColorValue(v: string): boolean {
    return this.colorService.isColorValue(v);
  }

  private getColorValue(key: string): string {
    return this.themeTableData.filter(row => row.key === key)[0].value;
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

  onSave(): void {
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

  private createForm(): FormGroup {
    return this.formBuilder.group({
      selectedThemeName: [''],
      tableFilter: [''],
      panels: this.formBuilder.group({
        all: [true],
        activepanel: [true],
        inactivepanel: [true]
      }),
      areas: this.formBuilder.group({
        all: [true],
        header: [true],
        table: [true],
        footer: [true],
        tooltip: [true],
        errorPanel: [true],
        material: [true],
        scrollbar: [true]
      }),
      property: this.formBuilder.group({
        all: [true],
        fg: [true],
        bg: [true],
        border: [true]
      })
    });
  }

  private setupFormSubscriptions(): void {
    // Subscribe to theme selection changes
    this.themeForm
      .get('selectedThemeName')
      ?.valueChanges
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

    // Subscribe to checkbox filter changes
    ['panels', 'areas', 'property'].forEach(groupName => {
      this.themeForm.get(groupName)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.applyFilters();
        });
    });
  }

  private loadThemeNames(): void {
    const obs = [
      this.configThemesService.loadCustomNames(),
      this.configThemesService.loadDefaultNames(),
    ];

    combineLatest(obs)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (names) => {
          this.themeNames = [...names[0], ...names[1].filter(name => !names[0].includes(name))];
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
          Object.entries(theme.colors).forEach(([key, value]) => {
            theme.colors[key] = this.expandHex(value);
          });

          this.selectedTheme = theme;
          this.prepareTableData();
          this.isLoading = false;
          this.cdr.detectChanges();
          this.lookAndFeelService.emitColors(this.tableData2Colors());
        },
        error: (error) => {
          console.error('Error loading theme:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private expandHex(hex: string): string {
    if (/^#([a-f\d])([a-f\d])([a-f\d])$/i.test(hex)) {
      return hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i,
        (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`);
    }
    return hex;
  }

  private prepareTableData(): void {
    if (!this.selectedTheme) {
      return;
    }

    this.themeTableData = Object.entries(this.selectedTheme.colors).map(([key, value]) => ({
      selected: false,
      key,
      value
    }));
    this.applyTableFilter(this.themeForm.get('tableFilter')?.value || '');
  }

  private applyTableFilter(filterValue: string): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    if (!this.themeTableData.length) {
      this.filteredTableData = [];
      this.cdr.detectChanges();
      return;
    }

    let filtered = [...this.themeTableData];

    // Apply text filter
    const textFilter = this.themeForm.get('tableFilter')?.value?.trim();
    if (textFilter) {
      const filter = textFilter.toLowerCase();
      filtered = filtered.filter(row =>
        row.key.toLowerCase().includes(filter) ||
        row.value.toLowerCase().includes(filter)
      );
    }

    // Apply checkbox filters
    filtered = filtered.filter(row => this.passesCheckboxFilters(row.key));

    this.filteredTableData = filtered;
    this.cdr.detectChanges();
  }

  private passesCheckboxFilters(key: string): boolean {
    const panelsGroup = this.themeForm.get('panels');
    const areasGroup = this.themeForm.get('areas');
    const propertyGroup = this.themeForm.get('property');

    if (!panelsGroup || !areasGroup || !propertyGroup) return true;

    // Check panels filter
    const panelsMatch = this.checkPanelsFilter(key, panelsGroup);
    if (!panelsMatch) return false;

    // Check areas filter
    const areasMatch = this.checkAreasFilter(key, areasGroup);
    if (!areasMatch) return false;

    // Check property filter
    const propertyMatch = this.checkPropertyFilter(key, propertyGroup);
    if (!propertyMatch) return false;

    return true;
  }

  private checkPanelsFilter(key: string, panelsGroup: any): boolean {
    const activepanelChecked = panelsGroup.get('activepanel')?.value;
    const inactivepanelChecked = panelsGroup.get('inactivepanel')?.value;

    if (activepanelChecked && inactivepanelChecked) return true;
    if (!activepanelChecked && !inactivepanelChecked) return false;


    if (activepanelChecked) {
      return key.includes('activepanel');
    }
    // 'inactivepanel' is checked
    return !key.includes('activepanel');
  }

  private checkAreasFilter(key: string, areasGroup: any): boolean {
    const areas = ['header', 'table', 'footer', 'tooltip', 'material', 'scrollbar'];
    const errorPanelChecked = areasGroup.get('errorPanel')?.value;

    // Special case for error-panel (mapped to errorPanel in form)
    if (key.includes('error-panel')) {
      return errorPanelChecked;
    }

    // Check other areas
    for (const area of areas) {
      if (key.includes(area)) {
        return areasGroup.get(area)?.value;
      }
    }

    // If key doesn't contain area-specific terms, it passes if any area filter is checked
    return areas.some(area => areasGroup.get(area)?.value) || errorPanelChecked;
  }

  private checkPropertyFilter(key: string, propertyGroup: any): boolean {
    const fgChecked = propertyGroup.get('fg')?.value;
    const bgChecked = propertyGroup.get('bg')?.value;
    const borderChecked = propertyGroup.get('border')?.value;

    if (key.includes('-fg-') || key.endsWith('-fg-color')) {
      return fgChecked;
    }
    if (key.includes('-bg-') || key.endsWith('-bg-color')) {
      return bgChecked;
    }
    if (key.includes('-border-') || key.endsWith('-border-color')) {
      return borderChecked;
    }

    // If key doesn't contain property-specific terms, it passes if any property filter is checked
    return fgChecked || bgChecked || borderChecked;
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
    this.lookAndFeelService.emitColors(this.tableData2Colors());
  }

  private tableData2Colors() {
    const colors: { [key: string]: string } = {};
    for (let i = 0; i < this.themeTableData.length; i++) {
      const t = this.themeTableData[i];
      colors[t.key] = t.value;
    }
    return colors;
  }

  private navigateToFiles(): void {
    this.router.navigate(['/files']);
  }

  endsWith(key: string | undefined, color: string) {
    if (!key) {
      return false;
    }
    return key.endsWith(color);
  }
}