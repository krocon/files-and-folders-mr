import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {ShortcutDialogComponent} from './shortcut-dialog.component';
import {ShortcutService} from '../../service/shortcut.service';
import {ActionIdLabelShortcut} from './action-id-label-shortcut';
import {EditShortcutDialogComponent} from './edit-shortcut-dialog.component';
import {BrowserOsType} from '@fnf/fnf-data';

describe('ShortcutDialogComponent', () => {
  let component: ShortcutDialogComponent;
  let fixture: ComponentFixture<ShortcutDialogComponent>;
  let mockDialogRef: { close: jest.Mock };
  let mockDialog: { open: jest.Mock };
  let mockShortcutService: jest.Mocked<ShortcutService>;

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

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn()
    };

    mockDialog = {
      open: jest.fn()
    };

    mockShortcutService = {
      getShortcutsByAction: jest.fn()
    } as unknown as jest.Mocked<ShortcutService>;

    // Mock the service to return shortcuts for actions
    mockShortcutService.getShortcutsByAction.mockImplementation((actionId: string) => {
      const item = mockActionIdLabelShortcuts.find(i => i.actionId === actionId);
      return item ? item.shortcuts : [];
    });

    await TestBed.configureTestingModule({
      imports: [
        ShortcutDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        {provide: MatDialogRef, useValue: mockDialogRef},
        {provide: MatDialog, useValue: mockDialog},
        {provide: ShortcutService, useValue: mockShortcutService}
      ]
    }).compileComponents();

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

  it('should open edit dialog when openEditDialog is called', () => {
    const mockActionItem = mockActionIdLabelShortcuts[0];
    const mockEditDialogRef = {
      afterClosed: jest.fn().mockReturnValue(of(undefined))
    };
    (mockDialog.open as jest.Mock).mockReturnValue(mockEditDialogRef);

    component.openEditDialog(mockActionItem);

    expect(mockDialog.open).toHaveBeenCalledWith(EditShortcutDialogComponent, {
      width: '600px',
      data: {
        actionItem: mockActionItem,
        osType: component.selectedOsType
      },
      disableClose: false
    });
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
    (mockDialog.open as jest.Mock).mockReturnValue(mockEditDialogRef);

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
    (mockDialog.open as jest.Mock).mockReturnValue(mockEditDialogRef);

    component.openEditDialog(mockActionItem);

    expect(component.allActionIdLabelShortcuts[0].shortcuts).toEqual(originalShortcuts);
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
