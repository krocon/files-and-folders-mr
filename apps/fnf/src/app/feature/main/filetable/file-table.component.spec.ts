import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ChangeDetectorRef} from '@angular/core';
import {FileTableComponent} from './file-table.component';
import {AppService} from '../../../app.service';
import {GridSelectionCountService} from '../../../service/grid-selection-count.service';
import {GotoAnythingDialogService} from '../../cmd/gotoanything/goto-anything-dialog.service';
import {NotifyService} from '../../task/service/notify-service';
import {SelectionLocalStorage} from './selection-local-storage';
import {FocusLocalStorage} from './focus-local-storage';
import {MkdirDialogService} from '../../cmd/mkdir/mkdir-dialog.service';
import {WalkdirService} from '../../../common/walkdir/walkdir.service';
import {ActionExecutionService} from '../../../service/action-execution.service';
import {RenderWrapperFactory} from '@guiexpert/angular-table';
import {FileItemIf, DOT_DOT} from '@fnf-data';

describe('FileTableComponent - Pattern Detection', () => {
  let component: FileTableComponent;
  let fixture: ComponentFixture<FileTableComponent>;

  // Mock dependencies
  const mockChangeDetectorRef = jest.fn();
  const mockRenderWrapperFactory = {
    create: jest.fn().mockReturnValue({})
  };
  const mockActionExecutionService = {
    setBodyAreaModel: jest.fn(),
    setSelectionManagers: jest.fn()
  };
  const mockAppService = {
    setBodyAreaModel: jest.fn(),
    setSelectionManagers: jest.fn(),
    onKeyDown$: {pipe: jest.fn().mockReturnValue({subscribe: jest.fn()})},
    onKeyUp$: {pipe: jest.fn().mockReturnValue({subscribe: jest.fn()})},
    onMouseClicked$: {pipe: jest.fn().mockReturnValue({subscribe: jest.fn()})},
    onSelectionChanged$: {pipe: jest.fn().mockReturnValue({subscribe: jest.fn()})},
    onDirEvents$: {pipe: jest.fn().mockReturnValue({subscribe: jest.fn()})},
    onActionEvent$: {pipe: jest.fn().mockReturnValue({subscribe: jest.fn()})},
    onFocusChanged$: {pipe: jest.fn().mockReturnValue({subscribe: jest.fn()})}
  };
  const mockGridSelectionCountService = jest.fn();
  const mockGotoAnythingDialogService = jest.fn();
  const mockNotifyService = jest.fn();
  const mockSelectionLocalStorage = jest.fn();
  const mockFocusLocalStorage = jest.fn();
  const mockMkdirDialogService = jest.fn();
  const mockWalkdirService = jest.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTableComponent],
      providers: [
        {provide: ChangeDetectorRef, useValue: mockChangeDetectorRef},
        {provide: RenderWrapperFactory, useValue: mockRenderWrapperFactory},
        {provide: ActionExecutionService, useValue: mockActionExecutionService},
        {provide: AppService, useValue: mockAppService},
        {provide: GridSelectionCountService, useValue: mockGridSelectionCountService},
        {provide: GotoAnythingDialogService, useValue: mockGotoAnythingDialogService},
        {provide: NotifyService, useValue: mockNotifyService},
        {provide: SelectionLocalStorage, useValue: mockSelectionLocalStorage},
        {provide: FocusLocalStorage, useValue: mockFocusLocalStorage},
        {provide: MkdirDialogService, useValue: mockMkdirDialogService},
        {provide: WalkdirService, useValue: mockWalkdirService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileTableComponent);
    component = fixture.componentInstance;
  });

  describe('detectSequentialPatterns', () => {
    it('should detect S01, S02, S03 pattern', () => {
      const directories = ['S01', 'S02', 'S03', 'other-folder'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual({
        prefix: 'S',
        maxNumber: 3,
        digits: 2
      });
    });

    it('should detect E01, E02 pattern', () => {
      const directories = ['E01', 'E02', 'random-dir'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual({
        prefix: 'E',
        maxNumber: 2,
        digits: 2
      });
    });

    it('should handle mixed patterns and return both', () => {
      const directories = ['S01', 'S02', 'E01', 'E02', 'E03'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(2);

      const sPattern = patterns.find((p: any) => p.prefix === 'S');
      const ePattern = patterns.find((p: any) => p.prefix === 'E');

      expect(sPattern).toEqual({
        prefix: 'S',
        maxNumber: 2,
        digits: 2
      });

      expect(ePattern).toEqual({
        prefix: 'E',
        maxNumber: 3,
        digits: 2
      });
    });

    it('should handle different digit padding', () => {
      const directories = ['S001', 'S002', 'S003'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual({
        prefix: 'S',
        maxNumber: 3,
        digits: 3
      });
    });

    it('should return empty array when no pattern detected', () => {
      const directories = ['folder1', 'folder2', 'random'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(0);
    });

    it('should return empty array for single occurrence', () => {
      const directories = ['S01', 'folder1', 'folder2'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(0);
    });

    it('should handle case-sensitive prefixes correctly', () => {
      const directories = ['s01', 's02', 'S03', 'S04'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(2);

      const lowerPattern = patterns.find((p: any) => p.prefix === 's');
      const upperPattern = patterns.find((p: any) => p.prefix === 'S');

      expect(lowerPattern).toEqual({
        prefix: 's',
        maxNumber: 2,
        digits: 2
      });

      expect(upperPattern).toEqual({
        prefix: 'S',
        maxNumber: 4,
        digits: 2
      });
    });

    it('should handle multi-character prefixes', () => {
      const directories = ['Season01', 'Season02', 'Season03'];
      const patterns = (component as any).detectSequentialPatterns(directories);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual({
        prefix: 'Season',
        maxNumber: 3,
        digits: 2
      });
    });
  });

  describe('generateNextSequenceName', () => {
    it('should generate next sequence name with correct padding', () => {
      const pattern = {prefix: 'S', maxNumber: 3, digits: 2};
      const nextName = (component as any).generateNextSequenceName(pattern);

      expect(nextName).toBe('S04');
    });

    it('should handle 3-digit padding', () => {
      const pattern = {prefix: 'E', maxNumber: 9, digits: 3};
      const nextName = (component as any).generateNextSequenceName(pattern);

      expect(nextName).toBe('E010');
    });

    it('should handle multi-character prefix', () => {
      const pattern = {prefix: 'Season', maxNumber: 5, digits: 2};
      const nextName = (component as any).generateNextSequenceName(pattern);

      expect(nextName).toBe('Season06');
    });

    it('should handle transition from single to double digits', () => {
      const pattern = {prefix: 'S', maxNumber: 9, digits: 2};
      const nextName = (component as any).generateNextSequenceName(pattern);

      expect(nextName).toBe('S10');
    });
  });

  describe('getNextSequentialDirName', () => {
    beforeEach(() => {
      // Mock bodyAreaModel
      const mockBodyAreaModel = {
        getFilteredRows: jest.fn()
      };
      (component as any).bodyAreaModel = mockBodyAreaModel;
    });

    it('should return null when bodyAreaModel is not available', () => {
      (component as any).bodyAreaModel = null;
      const result = (component as any).getNextSequentialDirName();

      expect(result).toBeNull();
    });

    it('should return null when no directories are present', () => {
      (component as any).bodyAreaModel.getFilteredRows.mockReturnValue([]);
      const result = (component as any).getNextSequentialDirName();

      expect(result).toBeNull();
    });

    it('should return suggested name for S01, S02, S03 pattern', () => {
      const mockFileItems: FileItemIf[] = [
        {dir: '/test', base: 'S01', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'S02', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'S03', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'file.txt', ext: 'txt', size: 100, date: '', isDir: false, abs: false}
      ];

      (component as any).bodyAreaModel.getFilteredRows.mockReturnValue(mockFileItems);
      const result = (component as any).getNextSequentialDirName();

      expect(result).toBe('S04');
    });

    it('should exclude DOT_DOT from pattern detection', () => {
      const mockFileItems: FileItemIf[] = [
        {dir: '/test', base: DOT_DOT, ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'E01', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'E02', ext: '', size: 0, date: '', isDir: true, abs: false}
      ];

      (component as any).bodyAreaModel.getFilteredRows.mockReturnValue(mockFileItems);
      const result = (component as any).getNextSequentialDirName();

      expect(result).toBe('E03');
    });

    it('should select pattern with highest max number when multiple patterns exist', () => {
      const mockFileItems: FileItemIf[] = [
        {dir: '/test', base: 'S01', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'S02', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'E01', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'E02', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'E03', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'E04', ext: '', size: 0, date: '', isDir: true, abs: false}
      ];

      (component as any).bodyAreaModel.getFilteredRows.mockReturnValue(mockFileItems);
      const result = (component as any).getNextSequentialDirName();

      expect(result).toBe('E05'); // E pattern has higher max number (4) than S pattern (2)
    });

    it('should return null when no valid patterns are detected', () => {
      const mockFileItems: FileItemIf[] = [
        {dir: '/test', base: 'folder1', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'folder2', ext: '', size: 0, date: '', isDir: true, abs: false},
        {dir: '/test', base: 'S01', ext: '', size: 0, date: '', isDir: true, abs: false} // Only one occurrence
      ];

      (component as any).bodyAreaModel.getFilteredRows.mockReturnValue(mockFileItems);
      const result = (component as any).getNextSequentialDirName();

      expect(result).toBeNull();
    });
  });
});