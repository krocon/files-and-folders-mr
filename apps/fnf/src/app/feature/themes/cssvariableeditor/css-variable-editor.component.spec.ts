import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {CssVariableEditorComponent} from './css-variable-editor.component';
import {MatDialog} from '@angular/material/dialog';
import {ColorService} from '../service/color.service';
import {ThemeTableRow} from '../theme-table-row.model';


describe('CssVariableEditorComponent', () => {
  let component: CssVariableEditorComponent;
  let fixture: ComponentFixture<CssVariableEditorComponent>;
  let mockDialog: { open: jest.Mock };
  let mockColorService: Partial<ColorService>;

  beforeEach(async () => {
    mockDialog = {
      open: jest.fn()
    };

    mockColorService = {
      isColorValue: jest.fn().mockReturnValue(true),
    } as Partial<ColorService>;

    await TestBed.configureTestingModule({
      imports: [CssVariableEditorComponent, NoopAnimationsModule],
      providers: [
        {provide: MatDialog, useValue: mockDialog},
        {provide: ColorService, useValue: mockColorService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CssVariableEditorComponent);
    component = fixture.componentInstance;
    // set inputs
    component.rows = [{selected: false, key: 'primary-color', value: '#ff0000'} as ThemeTableRow];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('openColorChangeDialog should update value on dialog result and emit colorChange rows', () => {
    const emitted: ThemeTableRow[][] = [];
    component.colorChange.subscribe(v => emitted.push(v));

    mockDialog.open.mockReturnValue({
      afterClosed: () => of({
        rows: [{
          selected: false,
          key: 'primary-color',
          value: '#00ff00'
        } as ThemeTableRow]
      })
    });

    component.openColorChangeDialog();

    expect(component.rows.map(r => r.value)).toEqual(['#00ff00']);
    expect(emitted.map(arr => arr.map(r => r.value))).toEqual([['#00ff00']]);
  });

  it('openColorChangeDialog should pass all provided rows to dialog and emit rows with same length as input', () => {
    const provided: ThemeTableRow[] = [
      {selected: false, key: 'k1', value: '#111111'},
      {selected: false, key: 'k2', value: '#222222'},
      {selected: false, key: 'k3', value: '#333333'},
    ];
    component.rows = [...provided];
    const emitted: ThemeTableRow[][] = [];
    component.colorChange.subscribe(v => emitted.push(v));

    mockDialog.open.mockReturnValue({
      afterClosed: () => of({
        rows: [
          {selected: false, key: 'k1', value: '#aaaaaa'},
          {selected: false, key: 'k2', value: '#bbbbbb'}
        ] as ThemeTableRow[]
      })
    });

    component.openColorChangeDialog();

    // Ensure dialog was called with all rows
    expect(mockDialog.open).toHaveBeenCalled();
    const callArgs = mockDialog.open.mock.calls[0][1];
    expect(callArgs.data.rows.map((r: ThemeTableRow) => r.value)).toEqual(provided.map(r => r.value));

    // After close, ensure length equals input length (3), padding with first returned color
    expect(component.rows.map(r => r.value)).toEqual(['#aaaaaa', '#bbbbbb', '#aaaaaa']);
    expect(emitted.map(arr => arr.map(r => r.value))).toEqual([['#aaaaaa', '#bbbbbb', '#aaaaaa']]);
  });

  it('openColorChangeDialog should not change when dialog returns undefined', () => {
    const initial = [...component.rows];
    mockDialog.open.mockReturnValue({afterClosed: () => of(undefined)});

    component.openColorChangeDialog();

    expect(component.rows).toEqual(initial);
  });
});
