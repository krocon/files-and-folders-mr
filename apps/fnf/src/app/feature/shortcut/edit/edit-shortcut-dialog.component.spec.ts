import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {EditShortcutDialogComponent, EditShortcutDialogData} from './edit-shortcut-dialog.component';
import {ShortcutService} from '../../../service/config/shortcut.service';
import {ActionIdLabelShortcut} from '../action-id-label-shortcut';
import {BrowserOsType} from '@fnf-data';

describe('EditShortcutDialogComponent', () => {
  let component: EditShortcutDialogComponent;
  let fixture: ComponentFixture<EditShortcutDialogComponent>;
  let mockDialogRef: { close: jest.Mock };
  let mockShortcutService: jest.Mocked<ShortcutService>;
  let mockDialogData: EditShortcutDialogData;

  beforeEach(async () => {
    const mockActionItem: ActionIdLabelShortcut = {
      actionId: 'TEST_ACTION',
      label: 'Test Action',
      shortcuts: ['cmd+shift+f', 'ctrl+alt+s']
    };

    mockDialogData = {
      actionItem: mockActionItem,
      osType: 'osx' as BrowserOsType
    };

    mockDialogRef = {
      close: jest.fn()
    };

    mockShortcutService = {
      createHarmonizedShortcutByKeyboardEvent: jest.fn(),
      saveShortcuts: jest.fn(),
      getActiveShortcuts: jest.fn()
    } as unknown as jest.Mocked<ShortcutService>;

    mockShortcutService.saveShortcuts.mockReturnValue(of({success: true, message: 'Shortcuts saved successfully'}));
    mockShortcutService.createHarmonizedShortcutByKeyboardEvent.mockReturnValue('cmd shift f');
    mockShortcutService.getActiveShortcuts.mockReturnValue({
      'cmd+shift+f': 'TEST_ACTION',
      'ctrl+alt+s': 'TEST_ACTION',
      'cmd c': 'COPY',
      'cmd v': 'PASTE'
    });

    await TestBed.configureTestingModule({
      imports: [
        EditShortcutDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        {provide: MatDialogRef, useValue: mockDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: mockDialogData},
        {provide: ShortcutService, useValue: mockShortcutService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditShortcutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with shortcuts from dialog data', () => {
    expect(component.shortcuts).toEqual(['cmd+shift+f', 'ctrl+alt+s']);
  });

  it('should add a new empty shortcut when onAddShortcut is called', () => {
    const initialLength = component.shortcuts.length;
    component.onAddShortcut();

    expect(component.shortcuts.length).toBe(initialLength + 1);
    expect(component.shortcuts[component.shortcuts.length - 1]).toBe('');
    expect(component.isCapturingShortcut).toBe(true);
    expect(component.captureIndex).toBe(initialLength);
  });

  it('should remove shortcut at specified index', () => {
    const initialShortcuts = [...component.shortcuts];
    component.onRemoveShortcut(0);

    expect(component.shortcuts.length).toBe(initialShortcuts.length - 1);
    expect(component.shortcuts).toEqual(['ctrl+alt+s']);
  });

  it('should start capturing shortcut when onEditShortcut is called', () => {
    component.onEditShortcut(0);

    expect(component.isCapturingShortcut).toBe(true);
    expect(component.captureIndex).toBe(0);
  });

  it('should stop capturing when onStopCapturing is called', () => {
    component.isCapturingShortcut = true;
    component.captureIndex = 0;

    component.onStopCapturing();

    expect(component.isCapturingShortcut).toBe(false);
    expect(component.captureIndex).toBe(-1);
  });

  it('should capture keyboard shortcut when in capturing mode', () => {
    component.isCapturingShortcut = true;
    component.captureIndex = 0;

    const mockKeyboardEvent = new KeyboardEvent('keyup', {
      key: 't',
      ctrlKey: true,
      shiftKey: true
    });

    jest.spyOn(mockKeyboardEvent, 'preventDefault');
    jest.spyOn(mockKeyboardEvent, 'stopPropagation');

    // Type the shortcut - with new deterministic approach, it's captured immediately
    component.onKeyUp(mockKeyboardEvent);

    expect(mockKeyboardEvent.preventDefault).toHaveBeenCalled();
    expect(mockKeyboardEvent.stopPropagation).toHaveBeenCalled();
    expect(mockShortcutService.createHarmonizedShortcutByKeyboardEvent).toHaveBeenCalledWith(mockKeyboardEvent);

    // With new deterministic approach, shortcut is captured immediately to sequence
    expect(component.isCapturingShortcut).toBe(true);
    expect(component.captureIndex).toBe(0);
    expect(component.currentShortcutInput).toBe('cmd+shift+f');
    expect(component.capturedChordSequence).toEqual(['cmd shift f']);

    // User presses ENTER to finalize (new deterministic behavior)
    const enterEvent = new KeyboardEvent('keyup', {key: 'Enter'});
    jest.spyOn(enterEvent, 'preventDefault');
    jest.spyOn(enterEvent, 'stopPropagation');

    component.onKeyUp(enterEvent);

    // Now the shortcut should be finalized with correct format (plus signs)
    expect(component.shortcuts[0]).toBe('cmd+shift+f');
    expect(component.isCapturingShortcut).toBe(false);
    expect(component.captureIndex).toBe(-1);
    expect(component.currentShortcutInput).toBe('');
    expect(component.capturedChordSequence).toEqual([]);
  });

  it('should not capture keyboard shortcut when not in capturing mode', () => {
    component.isCapturingShortcut = false;

    const mockKeyboardEvent = new KeyboardEvent('keyup', {
      key: 't',
      ctrlKey: true
    });

    jest.spyOn(mockKeyboardEvent, 'preventDefault');

    component.onKeyUp(mockKeyboardEvent);

    expect(mockKeyboardEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockShortcutService.createHarmonizedShortcutByKeyboardEvent).not.toHaveBeenCalled();
  });

  it('should reset shortcuts to original values when onReset is called', () => {
    component.shortcuts = ['modified shortcut'];
    component.onReset();

    expect(component.shortcuts).toEqual(['cmd+shift+f', 'ctrl+alt+s']);
  });

  it('should close dialog without saving when onCancel is called', () => {
    component.onCancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should save shortcuts and close dialog when onSave is called', () => {
    component.shortcuts = ['cmd+shift+f', '', 'ctrl+alt+s'];
    component.onSave();

    // Should save complete shortcut mapping with existing shortcuts preserved
    // and updated shortcuts for the current action
    expect(mockShortcutService.saveShortcuts).toHaveBeenCalledWith('osx', {
      'cmd c': 'COPY',           // Existing shortcuts for other actions preserved
      'cmd v': 'PASTE',          // Existing shortcuts for other actions preserved
      'cmd+shift+f': 'TEST_ACTION',  // New shortcuts for current action
      'ctrl+alt+s': 'TEST_ACTION'    // New shortcuts for current action
    });

    // Wait for the observable to complete
    fixture.whenStable().then(() => {
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        actionId: 'TEST_ACTION',
        label: 'Test Action',
        shortcuts: ['cmd+shift+f', 'ctrl+alt+s']
      });
    });
  });

  // it('should handle save error gracefully', () => {
  //   mockShortcutService.saveShortcuts.mockReturnValue(
  //     throwError(() => new Error('Save failed'))
  //   );
  //
  //   jest.spyOn(console, 'error');
  //
  //   component.onSave();
  //
  //   fixture.whenStable().then(() => {
  //     expect(console.error).toHaveBeenCalledWith('Failed to save shortcuts:', expect.any(Error));
  //     expect(mockDialogRef.close).not.toHaveBeenCalled();
  //   });
  // });

  it('should clean up state on destroy', () => {
    component.isCapturingShortcut = true;
    component.captureIndex = 1;

    component.ngOnDestroy();

    expect(component.isCapturingShortcut).toBe(false);
    expect(component.captureIndex).toBe(-1);
  });
});
