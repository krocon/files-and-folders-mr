import {TestBed} from '@angular/core/testing';
import {ChordState, KeyListenerService} from './key-listener.service';
import {ShortcutService} from './config/shortcut.service';

describe('KeyListenerService - Chord Integration Tests', () => {
  let service: KeyListenerService;
  let mockShortcutService: jest.Mocked<ShortcutService>;

  beforeEach(() => {
    // Create a comprehensive mock shortcut service
    mockShortcutService = {
      createHarmonizedShortcutByKeyboardEvent: jest.fn(),
      getActionByKeyEvent: jest.fn(),
      getActiveShortcuts: jest.fn(),
      getActionByChordSequence: jest.fn()
    } as unknown as jest.Mocked<ShortcutService>;

    // Mock the active shortcuts including the chord sequences from osx.json
    mockShortcutService.getActiveShortcuts.mockReturnValue({
      'ctrl f': 'OPEN_FIND_DLG',
      'cmd s': 'SAVE_FILE',
      'ctrl k f6': 'OPEN_TASK_DLG',        // Chord sequence from osx.json
      'ctrl k ctrl m': 'OPEN_MENU',        // Chord sequence from osx.json
      'f6': 'OPEN_MOVE_DLG',
      'ctrl k': 'DO_NOTHING'               // First chord has no direct action
    });

    TestBed.configureTestingModule({
      providers: [
        KeyListenerService,
        {provide: ShortcutService, useValue: mockShortcutService}
      ]
    });

    service = TestBed.inject(KeyListenerService);
  });

  const createMockKeyboardEvent = (options: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
  }): KeyboardEvent => {
    return {
      key: options.key,
      ctrlKey: options.ctrlKey || false,
      metaKey: options.metaKey || false,
      altKey: options.altKey || false,
      shiftKey: options.shiftKey || false
    } as KeyboardEvent;
  };

  describe('Single shortcut handling', () => {
    it('should handle single shortcuts correctly', () => {
      const ctrlF = createMockKeyboardEvent({key: 'f', ctrlKey: true});

      mockShortcutService.createHarmonizedShortcutByKeyboardEvent.mockReturnValue('ctrl f');
      mockShortcutService.getActionByKeyEvent.mockReturnValue('OPEN_FIND_DLG');
      mockShortcutService.getActiveShortcuts.mockReturnValue({'ctrl f': 'OPEN_FIND_DLG'});

      const result = service.processKeyEvent(ctrlF);

      // Single shortcuts should execute immediately when not in a chord sequence
      expect(result).toBe('OPEN_FIND_DLG');
      expect(service.getCurrentChordState().isCapturingChord).toBe(false);
      expect(service.getCurrentChordState().currentSequence).toEqual([]);
    });
  });

  describe('Chord sequence handling - ctrl+k f6', () => {
    it('should handle "ctrl+k f6" chord sequence correctly', (done) => {
      // Setup activeShortcuts mock
      const mockActiveShortcuts = {
        'ctrl k f6': 'OPEN_TASK_DLG',
        'f6': 'OPEN_MOVE_DLG'
      };
      mockShortcutService.getActiveShortcuts.mockReturnValue(mockActiveShortcuts);

      // First chord: ctrl+k
      const ctrlK = createMockKeyboardEvent({key: 'k', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValueOnce('ctrl k');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValueOnce('DO_NOTHING');

      const firstResult = service.processKeyEvent(ctrlK);

      expect(firstResult).toBeNull(); // First chord doesn't complete action
      expect(service.getCurrentChordState().isCapturingChord).toBe(true);
      expect(service.getCurrentChordState().currentSequence).toEqual(['ctrl k']);

      // Subscribe to shortcutDetected$ before processing the second chord
      service.shortcutDetected$.subscribe(action => {
        expect(action).toBe('OPEN_TASK_DLG');
        done();
      });

      // Second chord: f6
      const f6 = createMockKeyboardEvent({key: 'f6'});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValueOnce('f6');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValueOnce('OPEN_MOVE_DLG'); // f6 has its own action

      const secondResult = service.processKeyEvent(f6);

      expect(secondResult).toBe('OPEN_TASK_DLG'); // Should complete the chord
      expect(service.getCurrentChordState().isCapturingChord).toBe(false);
      expect(service.getCurrentChordState().currentSequence).toEqual([]);
    });
  });

  describe('Chord sequence handling - ctrl+k ctrl+m', () => {
    it('should handle "ctrl+k ctrl+m" chord sequence correctly', (done) => {
      // Setup activeShortcuts mock
      const mockActiveShortcuts = {
        'ctrl k ctrl m': 'OPEN_MENU'
      };
      mockShortcutService.getActiveShortcuts.mockReturnValue(mockActiveShortcuts);

      // First chord: ctrl+k
      const ctrlK = createMockKeyboardEvent({key: 'k', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValueOnce('ctrl k');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValueOnce('DO_NOTHING');

      const firstResult = service.processKeyEvent(ctrlK);

      expect(firstResult).toBeNull(); // First chord doesn't complete action
      expect(service.getCurrentChordState().isCapturingChord).toBe(true);
      expect(service.getCurrentChordState().currentSequence).toEqual(['ctrl k']);

      // Subscribe to shortcutDetected$ before processing the second chord
      service.shortcutDetected$.subscribe(action => {
        expect(action).toBe('OPEN_MENU');
        done();
      });

      // Second chord: ctrl+m
      const ctrlM = createMockKeyboardEvent({key: 'm', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValueOnce('ctrl m');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValueOnce('DO_NOTHING'); // ctrl+m might not have its own action

      const secondResult = service.processKeyEvent(ctrlM);

      expect(secondResult).toBe('OPEN_MENU'); // Should complete the chord
      expect(service.getCurrentChordState().isCapturingChord).toBe(false);
      expect(service.getCurrentChordState().currentSequence).toEqual([]);
    });
  });

  describe('Chord timeout handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should execute single shortcut immediately when it exists in activeShortcuts', (done) => {
      // Setup activeShortcuts mock - include 'ctrl f' 
      const mockActiveShortcuts = {
        'ctrl f': 'OPEN_FIND_DLG'
      };
      mockShortcutService.getActiveShortcuts.mockReturnValue(mockActiveShortcuts);

      // Test single shortcut execution
      const ctrlF = createMockKeyboardEvent({key: 'f', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValue('ctrl f');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValue('OPEN_FIND_DLG');

      const result = service.processKeyEvent(ctrlF);

      // With the new logic, single shortcuts execute immediately
      expect(result).toBe('OPEN_FIND_DLG');
      expect(service.getCurrentChordState().isCapturingChord).toBe(false);

      done();
    });

    it('should reset chord state when timeout occurs', () => {
      // Start a chord sequence
      const ctrlK = createMockKeyboardEvent({key: 'k', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValue('ctrl k');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValue('DO_NOTHING');

      service.processKeyEvent(ctrlK);
      expect(service.getCurrentChordState().isCapturingChord).toBe(true);

      // Fast-forward past the timeout
      jest.advanceTimersByTime(2500);

      expect(service.getCurrentChordState().isCapturingChord).toBe(false);
      expect(service.getCurrentChordState().currentSequence).toEqual([]);
    });
  });

  describe('Chord state management', () => {
    it('should emit chord state changes', () => {
      const stateChanges: ChordState[] = [];

      service.chordStateChanged$.subscribe(state => {
        stateChanges.push({...state});
      });

      // Initial state should be not capturing
      expect(stateChanges[0].isCapturingChord).toBe(false);

      // Start a chord
      const ctrlK = createMockKeyboardEvent({key: 'k', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValue('ctrl k');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValue('DO_NOTHING');

      service.processKeyEvent(ctrlK);

      // Should now be capturing
      const captureState = stateChanges[stateChanges.length - 1];
      expect(captureState.isCapturingChord).toBe(true);
      expect(captureState.currentSequence).toEqual(['ctrl k']);
    });

    it('should allow manual cancellation of chord sequences', () => {
      // Start a chord
      const ctrlK = createMockKeyboardEvent({key: 'k', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValue('ctrl k');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValue('DO_NOTHING');

      service.processKeyEvent(ctrlK);
      expect(service.getCurrentChordState().isCapturingChord).toBe(true);

      // Cancel the sequence
      service.cancelChordSequence();

      expect(service.getCurrentChordState().isCapturingChord).toBe(false);
      expect(service.getCurrentChordState().currentSequence).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty keyboard events gracefully', () => {
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValue('');

      const emptyEvent = createMockKeyboardEvent({key: ''});
      const result = service.processKeyEvent(emptyEvent);

      expect(result).toBeNull();
      expect(service.getCurrentChordState().isCapturingChord).toBe(false);
    });

    it('should handle invalid chord sequences', () => {
      // Start with a valid chord
      const ctrlK = createMockKeyboardEvent({key: 'k', ctrlKey: true});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValueOnce('ctrl k');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValueOnce('DO_NOTHING');

      service.processKeyEvent(ctrlK);

      // Follow with an invalid/unknown key combination
      const invalidKey = createMockKeyboardEvent({key: 'xyz'});
      mockShortcutService.createHarmonizedShortcutByKeyboardEvent
        .mockReturnValueOnce('xyz');
      mockShortcutService.getActionByKeyEvent
        .mockReturnValueOnce('DO_NOTHING');

      const result = service.processKeyEvent(invalidKey);

      // Should continue chord sequence but not find a match
      expect(result).toBeNull();
      expect(service.getCurrentChordState().isCapturingChord).toBe(true);
      expect(service.getCurrentChordState().currentSequence).toEqual(['ctrl k', 'xyz']);
    });
  });
});