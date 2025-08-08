import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {of} from 'rxjs';
import {ColorChangeDialogComponent, ColorChangeDialogData} from './color-change-dialog.component';
import {ColorService} from './color.service';

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
        {provide: MAT_DIALOG_DATA, useValue: {color: '#ff0000'} as ColorChangeDialogData},
        {provide: ColorService, useValue: mockColorService},
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorChangeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.originalColor).toBe('#ff0000');
    expect(component.workingColor).toBe('#ff0000');
  });

  it('applyInvert should use ColorService and update workingColor, then onApply should close with result', () => {
    mockColorService.invertCssColor.mockReturnValue('#00ffff');

    component.applyInvert();
    expect(mockColorService.invertCssColor).toHaveBeenCalledWith('#ff0000');
    expect(component.workingColor).toBe('#00ffff');

    component.onApply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({color: '#00ffff'});
  });

  it('applyMerge should call ColorService.mergeColors with defaults', () => {
    component.mergeColor = '#0000ff';
    component.mergeRatio = 0.5;
    component.mergeMode = 'alpha';
    mockColorService.mergeColors.mockReturnValue('#800080');

    component.applyMerge();

    expect(mockColorService.mergeColors).toHaveBeenCalledWith('#ff0000', '#0000ff', 0.5, 'alpha');
    expect(component.workingColor).toBe('#800080');
  });
});
