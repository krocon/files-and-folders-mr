import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {combineLatest, Subject, takeUntil} from 'rxjs';
import {ColorDataIf} from '@fnf-data';
import {ConfigThemesService} from '../../service/config/config-themes.service';
import {ColorService} from './service/color.service';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {LookAndFeelService} from "./service/look-and-feel.service";
import {CssVariableEditorComponent} from './cssvariableeditor/css-variable-editor.component';

import {SortDirection, ThemeTableColumn, ThemeTableRow, themeTableRowComparator} from './theme-table-row.model';
import {FnfConfirmationDialogService} from "../../common/confirmationdialog/fnf-confirmation-dialog.service";
import {MatDivider} from "@angular/material/divider";
import {AddCssVarDialogService} from "./addcssvar/add-css-var-dialog.service";
import {AddCssVarDialogData} from "./addcssvar/add-css-var-dialog.data";


@Component({
  selector: 'app-themes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    CssVariableEditorComponent,
    MatDivider
  ],
  templateUrl: './themes.component.html',
  styleUrls: ['./themes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemesComponent implements OnInit, OnDestroy {

  sortColumn: ThemeTableColumn | null = null;
  sortDirection: SortDirection = 'asc';

  refreshIndex = 0;
  themeForm: FormGroup;

  themeNames: string[] = [];
  defaultThemeNames: string[] = [];
  customThemeNames: string[] = [];

  selectedTheme: ColorDataIf | null = null;
  themeTableData: ThemeTableRow[] = [];
  filteredTableData: ThemeTableRow[] = [];

  multiValue: ThemeTableRow[] = [];

  isLoading = false;
  isSaving = false;
  isNamePredefined = false;
  isNameEmpty = true;

  presetColors: string[] = [];
  public selectionCount = 0;
  private destroy$ = new Subject<void>();

  // Performance optimization: cached lookups
  private _varLookupCache = new Map<string, { row: ThemeTableRow | undefined, index: number }>();
  private _stateCache = {
    isAllSelected: false,
    isIndeterminate: false,
    panelsIndeterminate: false,
    areasIndeterminate: false,
    propertyIndeterminate: false,
    lastDataHash: ''
  };

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly configThemesService: ConfigThemesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly colorService: ColorService,
    private readonly lookAndFeelService: LookAndFeelService,
    private readonly confirmationDialogService: FnfConfirmationDialogService,
    private readonly addCssVarDialogService: AddCssVarDialogService,
  ) {
    this.themeForm = this.createForm();
  }

  // Performance optimization: trackBy functions
  trackByThemeName = (index: number, themeName: string): string => themeName;
  trackByRowKey = (index: number, row: ThemeTableRow): string => row.key;

  // Optimized cached lookup methods
  getIndexFromVarValue(value: string): number {
    if (this._varLookupCache.has(value)) {
      return this._varLookupCache.get(value)!.index;
    }
    const key = value.replace('var(', '').replace(')', '');
    const index = this.filteredTableData.findIndex(row => row.key === key);
    const row = index >= 0 ? this.filteredTableData[index] : undefined;
    this._varLookupCache.set(value, {row, index});
    return index;
  }

  getRowFromVarValue(value: string): ThemeTableRow | undefined {
    if (this._varLookupCache.has(value)) {
      return this._varLookupCache.get(value)!.row;
    }
    const idx = this.getIndexFromVarValue(value);
    return idx >= 0 ? this.filteredTableData[idx] : undefined;
  }

  // Optimized state checking methods with caching
  get cachedIsAllSelected(): boolean {
    const dataHash = this.getDataHash();
    if (this._stateCache.lastDataHash !== dataHash) {
      this.updateStateCache();
    }
    return this._stateCache.isAllSelected;
  }

  get cachedIsIndeterminate(): boolean {
    const dataHash = this.getDataHash();
    if (this._stateCache.lastDataHash !== dataHash) {
      this.updateStateCache();
    }
    return this._stateCache.isIndeterminate;
  }

  cachedIsGroupIndeterminate(groupName: 'panels' | 'areas' | 'property'): boolean {
    const dataHash = this.getDataHash();
    if (this._stateCache.lastDataHash !== dataHash) {
      this.updateStateCache();
    }
    switch (groupName) {
      case 'panels':
        return this._stateCache.panelsIndeterminate;
      case 'areas':
        return this._stateCache.areasIndeterminate;
      case 'property':
        return this._stateCache.propertyIndeterminate;
      default:
        return false;
    }
  }

  ngOnInit(): void {
    this.loadThemeNames();
    this.setupFormSubscriptions();
    const theme = this.lookAndFeelService.getTheme();

    this.onThemeSelect(theme);
    this.loadTheme(theme);
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
        this.rebuildMultiValueFromSelection();
      }
      this.countSelections();
      this.invalidateCache();
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

  isIndeterminate(groupName?: 'panels' | 'areas' | 'property'): boolean {
    // If no groupName provided, check for table row selections
    if (!groupName) {
      const selectedCount = this.filteredTableData.filter(row => row.selected).length;
      return selectedCount > 0 && selectedCount < this.filteredTableData.length;
    }

    const group = this.themeForm.get(groupName) as FormGroup;
    if (!group) return false;

    const controls = Object.keys(group.controls).filter(key => key !== 'all');
    const checkedCount = controls.filter(controlName =>
      group.get(controlName)?.value === true
    ).length;

    return checkedCount > 0 && checkedCount < controls.length;
  }

  isAllSelected(): boolean {
    return this.filteredTableData.length > 0 &&
      this.filteredTableData.every(row => row.selected);
  }

  onToggleAllSelections(selectAll: boolean): void {
    this.filteredTableData.forEach((row, index) => {
      row.selected = selectAll;

      // Update the original data as well
      const originalIndex = this.themeTableData.findIndex(originalRow =>
        originalRow.key === row.key
      );
      if (originalIndex >= 0) {
        this.themeTableData[originalIndex].selected = selectAll;
      }
    });

    this.countSelections();
    this.invalidateCache();
    this.cdr.detectChanges();
  }


  onColorChange(index: number, rows: ThemeTableRow[]): void {
    this.refreshIndex++;

    if (index >= 0 && index < this.filteredTableData.length) {
      const value = rows && rows.length ? rows[0]?.value : '';
      this.filteredTableData[index].value = value;
      this.updateOriginalData(index, value);


    } else if (index === -1) {
      // Multi-edit: apply incoming rows' values to selected rows
      const selectedIndexes: number[] = [];
      for (let i = 0; i < this.filteredTableData.length; i++) {
        if (this.filteredTableData[i].selected) {
          selectedIndexes.push(i);
        }
      }

      const values = (rows || []).map(r => r.value);
      // Ensure parity: values array length equals selected count; if not, fill with first value
      const arr = (values && values.length)
        ? values.slice(0, selectedIndexes.length).concat(new Array(Math.max(0, selectedIndexes.length - values.length)).fill(values[0]))
        : new Array(selectedIndexes.length).fill('');

      // Build multiValue rows array reflecting selected rows with updated values
      const multiRows: ThemeTableRow[] = [];
      for (let j = 0; j < selectedIndexes.length; j++) {
        const idx = selectedIndexes[j];
        const updated: ThemeTableRow = {
          ...this.filteredTableData[idx],
          value: arr[j]
        };
        multiRows.push(updated);
        this.updateOriginalData(idx, arr[j]);
      }
      this.multiValue = multiRows;
    }
    this.cdr.detectChanges();
  }

  onSave(): void {
    if (!this.selectedTheme) {
      return;
    }

    const nameControl = this.themeForm.get('saveThemeName');
    const name = (nameControl?.value || '').trim();

    this.updateNameValidation();
    if (this.isNameEmpty || this.isNamePredefined) {
      return;
    }

    const data: ColorDataIf = {
      name,
      colors: this.tableData2Colors()
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    this.configThemesService.saveTheme(name, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          // refresh known names
          this.loadThemeNames();
          // set selected name to saved one
          this.themeForm.get('selectedThemeName')?.setValue(name);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error saving theme:', error);
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
  }


  onThemeSelect(themeName: string): void {
    this.themeForm.get('selectedThemeName')?.setValue(themeName);
    this.themeForm.get('saveThemeName')?.setValue(themeName);
    this.updateNameValidation();
  }

  isDeleteEnabled(): boolean {
    if (!this.themeForm) return false;
    return !this.defaultThemeNames.includes(this.themeForm.get('selectedThemeName')?.value);
  }

  onDeleteTheme() {
    if (!this.themeForm) return;

    const nameControl = this.themeForm.get('selectedThemeName');
    const name = (nameControl?.value || '').trim();

    // Only allow deletion of custom themes
    if (!name || !this.isDeleteEnabled()) {
      return;
    }

    this.confirmationDialogService.simpleConfirm(
      'Delete', `Do you want to delete '${name}'?`,
      () => {
        this.isSaving = true;
        this.cdr.detectChanges();

        this.configThemesService.deleteTheme(name)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.isSaving = false;
              // Choose a safe fallback theme (prefer 'light')
              const fallback = 'light';
              this.onThemeSelect(fallback);
              this.loadTheme(fallback);
              // Refresh known names after deletion
              this.loadThemeNames();
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error deleting theme:', error);
              this.isSaving = false;
              this.cdr.detectChanges();
            }
          });
      });
  }

  onAddCssVariableClicked() {
    if (this.selectedTheme !== null) {
      const para = new AddCssVarDialogData(this.selectedTheme);
      this.addCssVarDialogService.open(
        para,
        result => {
          if (result?.target) {

            const item = {
              selected: true,
              key: result.target,
              value: '#ffffff'
            } as ThemeTableRow;
            this.filteredTableData.push(item);
            this.themeTableData.push(item);

            // Apply current sorting if any
            this.applySort();

            this.cdr.detectChanges();
            console.log('this.filteredTableData', this.filteredTableData);
          }
        }
      )
    }
  }

  onHeaderDblClick(column: ThemeTableColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  private countSelections() {
    this.selectionCount = this.filteredTableData.filter(row => row.selected).length;
    this.rebuildMultiValueFromSelection();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      selectedThemeName: [this.lookAndFeelService.getTheme()],
      saveThemeName: [''],
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

    // Subscribe to save name changes for validation
    this.themeForm
      .get('saveThemeName')
      ?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateNameValidation());

    // Subscribe to filter changes
    this.themeForm.get('tableFilter')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => {
        this.applyFilters();
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
          this.customThemeNames = names[0] || [];
          this.defaultThemeNames = names[1] || [];
          this.themeNames = [
            ...this.customThemeNames,
            ...this.defaultThemeNames.filter(name => !this.customThemeNames.includes(name))
          ];
          this.updateNameValidation();
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

          this.presetColors = this.colorService.getRealColorsFromTheme(theme).sort();

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

    // Apply sorting if active
    if (this.sortColumn) {
      const comparator = themeTableRowComparator(this.sortColumn, this.sortDirection);
      filtered.sort(comparator);
    }

    this.filteredTableData = filtered;
    //this.cdr.detectChanges();
    console.info('###', this.filteredTableData);
    this.countSelections();
    this.invalidateCache();
  }

  private applySort(): void {
    if (!this.sortColumn) {
      // No sorting requested; just re-apply filters to rebuild filtered data
      this.applyFilters();
      return;
    }
    const comparator = themeTableRowComparator(this.sortColumn, this.sortDirection);
    // Sort the source data so future filtering maintains consistent order
    this.themeTableData.sort(comparator);
    // Re-apply filters to get filtered view and ensure it is sorted
    this.applyFilters();
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
    if (panelsGroup?.value?.all) return true;

    const activepanelChecked = panelsGroup.get('activepanel')?.value;
    if (activepanelChecked) {
      return key.includes('activepanel');
    }
    const inactivepanelChecked = panelsGroup.get('inactivepanel')?.value;
    if (inactivepanelChecked) {
      return !key.includes('activepanel');
    }
    return false;
  }

  private checkAreasFilter(key: string, areasGroup: any): boolean {
    if (areasGroup?.value?.all) return true;

    const checked = Object
      .keys(areasGroup.value)
      .filter(key => areasGroup.value[key]);

    return checked.some(area => key.includes(area));
  }

  private checkPropertyFilter(key: string, propertyGroup: any): boolean {
    if (propertyGroup?.value?.all) return true;

    const checked = Object
      .keys(propertyGroup.value)
      .filter(key => propertyGroup.value[key]);

    return checked.some(area => key.includes(area));
  }

  private updateNameValidation(): void {
    const control = this.themeForm.get('saveThemeName');
    const name = (control?.value || '').trim();
    this.isNameEmpty = !name;
    this.isNamePredefined = !!name && this.defaultThemeNames.includes(name);

    if (control) {
      const errors: any = {};
      if (this.isNameEmpty) {
        errors['required'] = true;
      }
      if (this.isNamePredefined) {
        errors['predefined'] = true;
      }
      control.setErrors(Object.keys(errors).length ? errors : null);
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
    this.lookAndFeelService.emitColors(this.tableData2Colors());
  }

  private rebuildMultiValueFromSelection(): void {
    const arr: ThemeTableRow[] = [];
    for (let i = 0; i < this.filteredTableData.length; i++) {
      if (this.filteredTableData[i].selected) {
        arr.push(this.filteredTableData[i]);
      }
    }
    this.multiValue = arr;
  }

  private tableData2Colors() {
    const colors: { [key: string]: string } = {};
    for (let i = 0; i < this.themeTableData.length; i++) {
      const t = this.themeTableData[i];
      colors[t.key] = t.value;
    }
    return colors;
  }

  // Performance optimization: cache helper methods
  private getDataHash(): string {
    // Create a simple hash based on data that affects the state calculations
    const selectedKeys = this.filteredTableData.filter(row => row.selected).map(row => row.key).join(',');
    const formValues = JSON.stringify(this.themeForm.value);
    return `${this.filteredTableData.length}-${selectedKeys}-${formValues}`;
  }

  private updateStateCache(): void {
    const selectedCount = this.filteredTableData.filter(row => row.selected).length;
    this._stateCache.isAllSelected = this.filteredTableData.length > 0 && selectedCount === this.filteredTableData.length;
    this._stateCache.isIndeterminate = selectedCount > 0 && selectedCount < this.filteredTableData.length;

    // Update group indeterminate states
    this._stateCache.panelsIndeterminate = this.calculateGroupIndeterminate('panels');
    this._stateCache.areasIndeterminate = this.calculateGroupIndeterminate('areas');
    this._stateCache.propertyIndeterminate = this.calculateGroupIndeterminate('property');

    this._stateCache.lastDataHash = this.getDataHash();
  }

  private calculateGroupIndeterminate(groupName: 'panels' | 'areas' | 'property'): boolean {
    const group = this.themeForm.get(groupName) as FormGroup;
    if (!group) return false;

    const controls = Object.keys(group.controls).filter(key => key !== 'all');
    const checkedCount = controls.filter(controlName =>
      group.get(controlName)?.value === true
    ).length;

    return checkedCount > 0 && checkedCount < controls.length;
  }

  private invalidateCache(): void {
    this._varLookupCache.clear();
    this._stateCache.lastDataHash = '';
  }
}