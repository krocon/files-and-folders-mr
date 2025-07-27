import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {ShortcutDialogComponent} from './shortcut-dialog.component';
import {ShortcutService} from '../../service/config/shortcut.service';
import {ActionIdLabelShortcut} from './action-id-label-shortcut';
import {EditShortcutDialogComponent} from './edit/edit-shortcut-dialog.component';
import {BrowserOsType} from '@fnf/fnf-data';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Component } from '@angular/core';

// Dummy stub for EditShortcutDialogComponent to prevent Angular Material dialog rendering errors
@Component({selector: 'fnf-edit-shortcut-dialog', template: ''})
class EditShortcutDialogComponentStub {}

describe('ShortcutDialogComponent', () => {
  let component: ShortcutDialogComponent;
  let fixture: ComponentFixture<ShortcutDialogComponent>;
  let mockDialogRef: { close: jest.Mock };
  let mockShortcutService: jest.Mocked<ShortcutService>;
  let openSpy: jest.SpyInstance;

  const mockActionIdLabelShortcuts: ActionIdLabelShortcut[] = [
    {
      actionId: 'COPY',
      label: 'Copy',
      shortcuts: ['cmd c', 'ctrl c']
    },
    {
      actionId: 'PASTE',
      label: 'Paste',
      shortcuts: ['cmd v', 'ctrl v']
    },
    {
      actionId: 'CUT',
      label: 'Cut',
      shortcuts: ['cmd x', 'ctrl x']
    }
  ];

  beforeAll(() => {
    jest.spyOn(MatDialog.prototype, 'open').mockImplementation(() => ({
      afterClosed: () => of(undefined)
    }) as any);
  });

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn()
    };
    // Remove the custom mockDialog, use a global spy instead

    mockShortcutService = {
      getShortcutsByAction: jest.fn(),
      getShortcutsFromApi: jest.fn()
    } as unknown as jest.Mocked<ShortcutService>;

    // Mock the service to return shortcuts for actions
    mockShortcutService.getShortcutsByAction.mockImplementation((actionId: string) => {
      const item = mockActionIdLabelShortcuts.find(i => i.actionId === actionId);
      return item ? item.shortcuts : [];
    });
    // Mock getShortcutsFromApi to return an observable
    mockShortcutService.getShortcutsFromApi.mockReturnValue(of({}));

    // Globally mock MatDialog.open
    // jest.spyOn(MatDialog.prototype, 'open').mockReturnValue(mockDialogRef);

    // Remove the custom provider for MatDialog, and globally mock open
    openSpy = jest.spyOn(MatDialog.prototype, 'open').mockReturnValue(
      { afterClosed: () => of(undefined) } as any
    );

    await TestBed.configureTestingModule({
      imports: [
        ShortcutDialogComponent,
        NoopAnimationsModule,
        EditShortcutDialogComponentStub
      ],
      providers: [
        {provide: MatDialogRef, useValue: mockDialogRef},
        {provide: ShortcutService, useValue: mockShortcutService}
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Globally mock MatDialog.open
    jest.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(undefined) } as any);

    fixture = TestBed.createComponent(ShortcutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default OS type', () => {
    expect(component.selectedOsType).toBe('osx');
  });

  it('should load shortcuts on init', () => {
    expect(component.allActionIdLabelShortcuts).toBeDefined();
    expect(component.actionIdLabelShortcuts).toBeDefined();
    expect(component.allActionIdLabelShortcuts.length).toBeGreaterThan(0);
  });

  it('should change OS type when onOsTypeChange is called', () => {
    const newOsType: BrowserOsType = 'windows';
    const mockEvent = {value: newOsType};

    jest.spyOn(component as any, 'loadShortcutsForOsType');

    component.onOsTypeChange(mockEvent);

    expect(component.selectedOsType).toBe(newOsType);
    expect((component as any).loadShortcutsForOsType).toHaveBeenCalledWith(newOsType);
  });

  it('should filter shortcuts based on filter text', () => {
    component.allActionIdLabelShortcuts = mockActionIdLabelShortcuts;
    component.filterText = 'copy';

    (component as any).applyFilter('copy');

    expect(component.actionIdLabelShortcuts.length).toBe(1);
    expect(component.actionIdLabelShortcuts[0].actionId).toBe('COPY');
  });

  it('should filter shortcuts by label', () => {
    component.allActionIdLabelShortcuts = mockActionIdLabelShortcuts;

    (component as any).applyFilter('paste');

    expect(component.actionIdLabelShortcuts.length).toBe(1);
    expect(component.actionIdLabelShortcuts[0].label).toBe('Paste');
  });

  it('should filter shortcuts by shortcut keys', () => {
    component.allActionIdLabelShortcuts = mockActionIdLabelShortcuts;

    (component as any).applyFilter('cmd c');

    expect(component.actionIdLabelShortcuts.length).toBe(1);
    expect(component.actionIdLabelShortcuts[0].actionId).toBe('COPY');
  });

  it('should reset filter when resetFilter is called', () => {
    component.allActionIdLabelShortcuts = mockActionIdLabelShortcuts;
    component.filterText = 'test';
    component.actionIdLabelShortcuts = [];

    component.resetFilter();

    expect(component.filterText).toBe('');
    expect(component.actionIdLabelShortcuts).toEqual(mockActionIdLabelShortcuts);
  });

  it('should handle filter change with debounce', () => {
    const mockInput = document.createElement('input');
    mockInput.value = 'copy';
    const mockEvent = {target: mockInput} as any;

    jest.spyOn(component['filterTextChanged'], 'next');

    component.onFilterChange(mockEvent);

    expect(component['filterTextChanged'].next).toHaveBeenCalledWith('copy');
  });

  it('should close dialog when onCancelClicked is called', () => {
    component.onCancelClicked();

    expect(mockDialogRef.close).toHaveBeenCalledWith(undefined);
  });

  describe('Edit dialog', () => {
    let originalOpen: any;
    beforeEach(() => {
      originalOpen = MatDialog.prototype.open;
    });
    afterEach(() => {
      if (openSpy) openSpy.mockRestore();
    });

    it('should open edit dialog when openEditDialog is called', () => {
      const mockActionItem = mockActionIdLabelShortcuts[0];
      const mockEditDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of(undefined))
      };
      MatDialog.prototype.open = jest.fn().mockReturnValue(mockEditDialogRef);

      component.openEditDialog(mockActionItem);

      // Check that MatDialog.open was called with the correct arguments
      const dialog = TestBed.inject(MatDialog);
      expect(MatDialog.prototype.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        width: '600px',
        data: expect.objectContaining({
          actionItem: mockActionItem,
          osType: component.selectedOsType
        }),
        disableClose: false
      }));
    });

    it('should update shortcuts when edit dialog returns updated item', () => {
      const mockActionItem = mockActionIdLabelShortcuts[0];
      const updatedItem: ActionIdLabelShortcut = {
        ...mockActionItem,
        shortcuts: ['cmd shift c', 'ctrl shift c']
      };

      component.allActionIdLabelShortcuts = [...mockActionIdLabelShortcuts];
      component.actionIdLabelShortcuts = [...mockActionIdLabelShortcuts];

      const mockEditDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of(updatedItem))
      };
      MatDialog.prototype.open = jest.fn().mockReturnValue(mockEditDialogRef);

      jest.spyOn(component as any, 'applyFilter');

      component.openEditDialog(mockActionItem);

      expect(component.allActionIdLabelShortcuts[0].shortcuts).toEqual(['cmd shift c', 'ctrl shift c']);
      expect((component as any).applyFilter).toHaveBeenCalledWith(component.filterText);
    });

    it('should not update shortcuts when edit dialog is cancelled', () => {
      const mockActionItem = mockActionIdLabelShortcuts[0];
      const originalShortcuts = [...mockActionItem.shortcuts];

      component.allActionIdLabelShortcuts = [...mockActionIdLabelShortcuts];

      const mockEditDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of(undefined))
      };
      MatDialog.prototype.open = jest.fn().mockReturnValue(mockEditDialogRef);

      component.openEditDialog(mockActionItem);

      expect(component.allActionIdLabelShortcuts[0].shortcuts).toEqual(originalShortcuts);
    });
  });

  it('should unsubscribe on destroy', () => {
    const subscription = component['subscription'];
    jest.spyOn(subscription!, 'unsubscribe');

    component.ngOnDestroy();

    expect(subscription!.unsubscribe).toHaveBeenCalled();
  });

  it('should handle null subscription on destroy', () => {
    component['subscription'] = null;

    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
