import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ColorChangeDialogComponent} from './color-change-dialog.component';
import {ColorService} from '../service/color.service';
import {ThemeTableRow} from '../theme-table-row.model';
import {ColorChangeDialogData} from "./color-change-dialog.data";

describe('ColorChangeDialogComponent', () => {
  let component: ColorChangeDialogComponent;
  let fixture: ComponentFixture<ColorChangeDialogComponent>;
  let mockDialogRef: { close: jest.Mock };
  let mockColorService: jest.Mocked<ColorService>;

  beforeEach(async () => {
    mockDialogRef = {close: jest.fn()};

    mockColorService = {
      getRealColorsFromTheme: jest.fn(),
      invertCssColor: jest.fn(),
      brighter: jest.fn(),
      darker: jest.fn(),
      transparent: jest.fn(),
      isColorValue: jest.fn(),
      mergeColors: jest.fn(),
      blendColorsAlpha: jest.fn(),
      // private helpers are not part of interface here
    } as unknown as jest.Mocked<ColorService>;

    await TestBed.configureTestingModule({
      imports: [ColorChangeDialogComponent, NoopAnimationsModule],
      providers: [
        {provide: MatDialogRef, useValue: mockDialogRef},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {rows: [{selected: false, key: 'k', value: '#ff0000'} as ThemeTableRow]} as ColorChangeDialogData
        },
        {provide: ColorService, useValue: mockColorService},
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorChangeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.originalRows.length).toEqual(1);
    expect(component.originalRows[0].value).toEqual('#ff0000');
    expect(component.workingRows[0].value).toEqual('#ff0000');
  });

  it('applyInvert should use ColorService and update workingRows, then onApply should close with result', () => {
    mockColorService.invertCssColor.mockReturnValue('#00ffff');

    component.applyInvert();
    expect(mockColorService.invertCssColor).toHaveBeenCalledWith('#ff0000');
    expect(component.workingRows.map(r => r.value)).toEqual(['#00ffff']);

    component.onApply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({rows: [{selected: false, key: 'k', value: '#00ffff'}]});
  });

  it('applyMerge should call ColorService.mergeColors with defaults', () => {
    component.mergeColor = '#0000ff';
    component.mergeRatio = 0.5;
    component.mergeMode = 'alpha';
    mockColorService.mergeColors.mockReturnValue('#800080');

    component.applyMerge();

    expect(mockColorService.mergeColors).toHaveBeenCalledWith('#ff0000', '#0000ff', 0.5, 'alpha');
    expect(component.workingRows.map(r => r.value)).toEqual(['#800080']);
  });

  it('slider change (lightnessDelta) should update all values in workingRows', () => {
    const rows: ThemeTableRow[] = [
      {selected: false, key: 'k1', value: '#111111'},
      {selected: false, key: 'k2', value: '#222222'},
      {selected: false, key: 'k3', value: '#333333'},
    ];

    // prepare component state with multiple rows
    component.originalRows = rows.map(r => ({...r}));
    component.workingRows = rows.map(r => ({...r}));

    // set slider to a non-zero value to trigger brighter()
    component.lightnessDelta = 10;
    (mockColorService.brighter as jest.Mock).mockImplementation((c: string, delta: number) => `${c}-b${delta}`);

    component.recompute();

    expect(component.workingRows.map(r => r.value)).toEqual(['#111111-b10', '#222222-b10', '#333333-b10']);
    expect(mockColorService.brighter).toHaveBeenCalledTimes(3);
  });
});
