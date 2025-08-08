import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {CssVariableEditorComponent} from './css-variable-editor.component';
import {MatDialog} from '@angular/material/dialog';
import {ColorService} from './color.service';


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
    component.key = 'primary-color';
    component.value = ['#ff0000'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('openColorChangeDialog should update value on dialog result and emit colorChange array', () => {
    const emitted: string[][] = [];
    component.colorChange.subscribe(v => emitted.push(v));

    mockDialog.open.mockReturnValue({afterClosed: () => of({colors: ['#00ff00']})});

    component.openColorChangeDialog();

    expect(component.value).toEqual(['#00ff00']);
    expect(emitted).toEqual([['#00ff00']]);
  });

  it('openColorChangeDialog should pass all provided values to dialog and emit array with same length as input', () => {
    const provided = ['#111111', '#222222', '#333333'];
    component.value = [...provided];
    const emitted: string[][] = [];
    component.colorChange.subscribe(v => emitted.push(v));

    mockDialog.open.mockReturnValue({afterClosed: () => of({colors: ['#aaaaaa', '#bbbbbb']})});

    component.openColorChangeDialog();

    // Ensure dialog was called with all colors
    expect(mockDialog.open).toHaveBeenCalled();
    const callArgs = mockDialog.open.mock.calls[0][1];
    expect(callArgs.data.colors).toEqual(provided);

    // After close, ensure length equals input length (3), padding with first returned color
    expect(component.value).toEqual(['#aaaaaa', '#bbbbbb', '#aaaaaa']);
    expect(emitted).toEqual([['#aaaaaa', '#bbbbbb', '#aaaaaa']]);
  });

  it('openColorChangeDialog should not change when dialog returns undefined', () => {
    const initial = [...component.value];
    mockDialog.open.mockReturnValue({afterClosed: () => of(undefined)});

    component.openColorChangeDialog();

    expect(component.value).toEqual(initial);
  });
});
