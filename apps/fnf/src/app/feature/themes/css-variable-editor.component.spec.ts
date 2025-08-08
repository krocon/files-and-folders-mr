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
    component.value = '#ff0000';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('openColorChangeDialog should update value on dialog result and emit colorChange', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe(v => emitted.push(v));

    mockDialog.open.mockReturnValue({afterClosed: () => of({color: '#00ff00'})});

    component.openColorChangeDialog();

    expect(component.value).toBe('#00ff00');
    expect(emitted).toEqual(['#00ff00']);
  });

  it('openColorChangeDialog should not change when dialog returns undefined', () => {
    const initial = component.value;
    mockDialog.open.mockReturnValue({afterClosed: () => of(undefined)});

    component.openColorChangeDialog();

    expect(component.value).toBe(initial);
  });
});
