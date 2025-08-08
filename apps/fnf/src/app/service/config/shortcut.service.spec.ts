import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ShortcutService, ShortcutActionMapping} from './shortcut.service';
import {BrowserOsType} from '@fnf-data';

describe('ShortcutService', () => {
  let service: ShortcutService;
  let httpMock: HttpTestingController;

  const mockShortcuts: ShortcutActionMapping = {
    'f3': 'OPEN_VIEW_DLG',
    'f4': 'OPEN_EDIT_DLG',
    'shift f4': 'OPEN_CREATE_FILE_DLG',
    'f5': 'OPEN_COPY_DLG',
    'f6': 'OPEN_MOVE_DLG',
    'ctrl cmd c': 'OPEN_COPY_DLG',
    'ctrl cmd m': 'OPEN_MOVE_DLG',
    'ctrl cmd g': 'OPEN_GOTO_ANYTHING_DLG',
    'enter': 'ENTER_PRESSED'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShortcutService]
    });
    service = TestBed.inject(ShortcutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('ActionId Conversion', () => {
    beforeEach(() => {
      // Set up the service with mock data
      (service as any).activeShortcuts = mockShortcuts;
      (service as any).buildActionToShortcutsMapping(mockShortcuts);
    });

    describe('convertActionIdsInSequence', () => {
      it('should convert single ActionId in sequence', () => {
        const input = '(OPEN_COPY_DLG)(Users)(Enter)';
        const result = service.convertActionIdsInSequence(input);
        expect(result).toBe('(f5)(Users)(Enter)');
      });

      it('should convert ActionId with modifiers to proper format', () => {
        const input = '(OPEN_GOTO_ANYTHING_DLG)(Search)(Enter)';
        const result = service.convertActionIdsInSequence(input);
        expect(result).toBe('(Control|Meta|g)(Search)(Enter)');
      });

      it('should convert multiple ActionIds in sequence', () => {
        const input = '(OPEN_VIEW_DLG)(OPEN_EDIT_DLG)(OPEN_COPY_DLG)';
        const result = service.convertActionIdsInSequence(input);
        expect(result).toBe('(f3)(f4)(f5)');
      });

      it('should preserve unknown ActionIds', () => {
        const input = '(UNKNOWN_ACTION)(Test)';
        const result = service.convertActionIdsInSequence(input);
        expect(result).toBe('(UNKNOWN_ACTION)(Test)');
      });

      it('should preserve text without ActionIds', () => {
        const input = 'Normal text without ActionIds';
        const result = service.convertActionIdsInSequence(input);
        expect(result).toBe('Normal text without ActionIds');
      });

      it('should handle mixed ActionIds and unknown patterns', () => {
        const input = '(OPEN_COPY_DLG)(Unknown)(ENTER_PRESSED)';
        const result = service.convertActionIdsInSequence(input);
        expect(result).toBe('(f5)(Unknown)(enter)');
      });

      it('should handle empty string', () => {
        const result = service.convertActionIdsInSequence('');
        expect(result).toBe('');
      });
    });

    describe('processShortcutSequences', () => {
      it('should process array of shortcut sequences', () => {
        const input = [
          '(OPEN_COPY_DLG)(Users)(Enter)',
          '(OPEN_MOVE_DLG)(Files)',
          'Regular shortcut'
        ];
        const result = service.processShortcutSequences(input);
        expect(result).toEqual([
          '(f5)(Users)(Enter)',
          '(f6)(Files)',
          'Regular shortcut'
        ]);
      });

      it('should handle empty array', () => {
        const result = service.processShortcutSequences([]);
        expect(result).toEqual([]);
      });
    });

    describe('selectBestShortcut', () => {
      it('should return single shortcut when only one available', () => {
        const shortcuts = ['f3'];
        const result = (service as any).selectBestShortcut(shortcuts);
        expect(result).toBe('f3');
      });

      it('should prefer shortcut with fewer modifiers', () => {
        const shortcuts = ['ctrl cmd c', 'f5'];
        const result = (service as any).selectBestShortcut(shortcuts);
        expect(result).toBe('f5');
      });

      it('should prefer shorter shortcut when modifier count is same', () => {
        const shortcuts = ['ctrl alt shift a', 'ctrl a'];
        const result = (service as any).selectBestShortcut(shortcuts);
        expect(result).toBe('ctrl a');
      });
    });

    describe('convertShortcutToSequenceFormat', () => {
      it('should convert single key', () => {
        const result = (service as any).convertShortcutToSequenceFormat('f5');
        expect(result).toBe('f5');
      });

      it('should convert modifiers with key', () => {
        const result = (service as any).convertShortcutToSequenceFormat('ctrl cmd g');
        expect(result).toBe('Control|Meta|g');
      });

      it('should handle all modifier types', () => {
        const result = (service as any).convertShortcutToSequenceFormat('ctrl alt shift cmd a');
        expect(result).toBe('Control|Alt|Shift|Meta|a');
      });

      it('should preserve unknown modifiers', () => {
        const result = (service as any).convertShortcutToSequenceFormat('unknown modifier a');
        expect(result).toBe('unknown|modifier|a');
      });

      it('should handle extra spaces', () => {
        const result = (service as any).convertShortcutToSequenceFormat('  ctrl   cmd   g  ');
        expect(result).toBe('Control|Meta|g');
      });
    });

    describe('buildActionToShortcutsMapping', () => {
      it('should build correct reverse mapping', () => {
        const shortcuts: ShortcutActionMapping = {
          'f5': 'OPEN_COPY_DLG',
          'ctrl cmd c': 'OPEN_COPY_DLG',
          'f6': 'OPEN_MOVE_DLG'
        };

        (service as any).buildActionToShortcutsMapping(shortcuts);
        const actionToShortcuts = (service as any).actionToShortcuts;

        expect(actionToShortcuts['OPEN_COPY_DLG']).toEqual(['f5', 'ctrl cmd c']);
        expect(actionToShortcuts['OPEN_MOVE_DLG']).toEqual(['f6']);
      });

      it('should handle empty shortcuts', () => {
        (service as any).buildActionToShortcutsMapping({});
        const actionToShortcuts = (service as any).actionToShortcuts;
        expect(actionToShortcuts).toEqual({});
      });
    });
  });

  describe('API Integration', () => {
    it('should load shortcuts from API and build reverse mapping', () => {
      const osType: BrowserOsType = 'osx';

      service.getShortcutsFromApi(osType).subscribe(shortcuts => {
        expect(shortcuts).toEqual(mockShortcuts);
        // Verify reverse mapping was built
        const actionToShortcuts = (service as any).actionToShortcuts;
        expect(actionToShortcuts['OPEN_COPY_DLG']).toContain('f5');
        expect(actionToShortcuts['OPEN_COPY_DLG']).toContain('ctrl cmd c');
      });

      const req = httpMock.expectOne('api/shortcuts/osx');
      expect(req.request.method).toBe('GET');
      req.flush(mockShortcuts);
    });

    it('should handle API error and fallback', () => {
      const osType: BrowserOsType = 'osx';
      const mockFallbackShortcuts = {'f1': 'TEST_ACTION'};

      jest.spyOn(service as any, 'fetchShortcutMappings').mockReturnValue(
        new Promise(resolve => resolve(mockFallbackShortcuts))
      );

      service.getShortcutsFromApi(osType).subscribe(
        shortcuts => {
          expect(shortcuts).toBeDefined();
        },
        error => {
          // Error handling is expected in this test
        }
      );

      const req = httpMock.expectOne('api/shortcuts/osx');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Key Modifier Mapping', () => {
    it('should have correct key modifier mappings', () => {
      const keyModifierMapping = (ShortcutService as any).keyModifierMapping;
      expect(keyModifierMapping['ctrl']).toBe('Control');
      expect(keyModifierMapping['cmd']).toBe('Meta');
      expect(keyModifierMapping['alt']).toBe('Alt');
      expect(keyModifierMapping['shift']).toBe('Shift');
    });
  });
});