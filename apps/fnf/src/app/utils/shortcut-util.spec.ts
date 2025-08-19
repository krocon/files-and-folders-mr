import {
  createChordedShortcut,
  createHarmonizedShortcutByKeyboardEvent,
  harmonizeShortcut,
  isChordedShortcut,
  parseChordedShortcut
} from './shortcut-util';

describe('ShortcutUtil', () => {

  describe('harmonizeShortcut', () => {
    it('should handle single shortcuts', () => {
      expect(harmonizeShortcut('ctrl+f')).toBe('ctrl f');
      expect(harmonizeShortcut('cmd+s')).toBe('cmd s');
      expect(harmonizeShortcut('shift+f4')).toBe('shift f4');
      expect(harmonizeShortcut('alt+ctrl+z')).toBe('ctrl alt z');
    });

    it('should handle chorded shortcuts from osx.json', () => {
      expect(harmonizeShortcut('ctrl+k f6')).toBe('ctrl k f6');
      expect(harmonizeShortcut('ctrl+k ctrl+m')).toBe('ctrl k ctrl m');
    });

    it('should normalize modifier order', () => {
      expect(harmonizeShortcut('shift+alt+ctrl+a')).toBe('ctrl alt shift a');
      expect(harmonizeShortcut('cmd+shift+ctrl+b')).toBe('ctrl shift cmd b');
    });

    it('should handle empty or invalid input', () => {
      expect(harmonizeShortcut('')).toBe('');
      expect(harmonizeShortcut(null as any)).toBe('');
      expect(harmonizeShortcut(undefined as any)).toBe('');
    });

    it('should handle mixed case input', () => {
      expect(harmonizeShortcut('CTRL+F')).toBe('ctrl f');
      expect(harmonizeShortcut('Shift+Alt+A')).toBe('alt shift a');
    });
  });

  describe('createHarmonizedShortcutByKeyboardEvent', () => {
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

    it('should handle single key presses', () => {
      const event = createMockKeyboardEvent({key: 'f'});
      expect(createHarmonizedShortcutByKeyboardEvent(event)).toBe('f');
    });

    it('should handle modifier combinations', () => {
      const ctrlF = createMockKeyboardEvent({key: 'f', ctrlKey: true});
      expect(createHarmonizedShortcutByKeyboardEvent(ctrlF)).toBe('ctrl f');

      const cmdS = createMockKeyboardEvent({key: 's', metaKey: true});
      expect(createHarmonizedShortcutByKeyboardEvent(cmdS)).toBe('cmd s');

      const ctrlShiftZ = createMockKeyboardEvent({
        key: 'z',
        ctrlKey: true,
        shiftKey: true
      });
      expect(createHarmonizedShortcutByKeyboardEvent(ctrlShiftZ)).toBe('ctrl shift z');
    });

    it('should handle chord sequences - first chord', () => {
      const ctrlK = createMockKeyboardEvent({key: 'k', ctrlKey: true});
      expect(createHarmonizedShortcutByKeyboardEvent(ctrlK)).toBe('ctrl k');
    });

    it('should handle chord sequences - second chord', () => {
      const f6 = createMockKeyboardEvent({key: 'f6'});
      expect(createHarmonizedShortcutByKeyboardEvent(f6)).toBe('f6');

      const ctrlM = createMockKeyboardEvent({key: 'm', ctrlKey: true});
      expect(createHarmonizedShortcutByKeyboardEvent(ctrlM)).toBe('ctrl m');
    });

    it('should ignore modifier-only key presses', () => {
      const ctrl = createMockKeyboardEvent({key: 'Control', ctrlKey: true});
      expect(createHarmonizedShortcutByKeyboardEvent(ctrl)).toBe('');

      const shift = createMockKeyboardEvent({key: 'Shift', shiftKey: true});
      expect(createHarmonizedShortcutByKeyboardEvent(shift)).toBe('');
    });

    it('should handle special key mappings', () => {
      const space = createMockKeyboardEvent({key: ' '});
      expect(createHarmonizedShortcutByKeyboardEvent(space)).toBe('space');

      const escape = createMockKeyboardEvent({key: 'Escape'});
      expect(createHarmonizedShortcutByKeyboardEvent(escape)).toBe('esc');
    });

    it('should handle null/undefined input', () => {
      expect(createHarmonizedShortcutByKeyboardEvent(null as any)).toBe('');
      expect(createHarmonizedShortcutByKeyboardEvent(undefined as any)).toBe('');
    });
  });

  describe('isChordedShortcut', () => {
    it('should identify chorded shortcuts', () => {
      expect(isChordedShortcut('ctrl k f6')).toBe(true);
      expect(isChordedShortcut('ctrl k ctrl m')).toBe(true);
      expect(isChordedShortcut('f4 f5')).toBe(true);
    });

    it('should not identify single shortcuts as chorded', () => {
      expect(isChordedShortcut('ctrl f')).toBe(false);
      expect(isChordedShortcut('shift f4')).toBe(false);
      expect(isChordedShortcut('ctrl alt shift a')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isChordedShortcut('')).toBe(false);
      expect(isChordedShortcut('   ')).toBe(false);
      expect(isChordedShortcut(null as any)).toBe(false);
      expect(isChordedShortcut(undefined as any)).toBe(false);
    });
  });

  describe('parseChordedShortcut', () => {
    it('should parse chorded shortcuts into parts', () => {
      expect(parseChordedShortcut('ctrl k f6')).toEqual(['ctrl', 'k', 'f6']);
      expect(parseChordedShortcut('ctrl k ctrl m')).toEqual(['ctrl', 'k', 'ctrl', 'm']);
    });

    it('should handle single shortcuts', () => {
      expect(parseChordedShortcut('ctrl f')).toEqual(['ctrl', 'f']);
    });

    it('should handle whitespace', () => {
      expect(parseChordedShortcut('  ctrl k   f6  ')).toEqual(['ctrl', 'k', 'f6']);
    });

    it('should handle empty input', () => {
      expect(parseChordedShortcut('')).toEqual([]);
      expect(parseChordedShortcut(null as any)).toEqual([]);
    });
  });

  describe('createChordedShortcut', () => {
    it('should create chorded shortcuts from arrays', () => {
      expect(createChordedShortcut(['ctrl k', 'f6'])).toBe('ctrl k f6');
      expect(createChordedShortcut(['ctrl k', 'ctrl m'])).toBe('ctrl k ctrl m');
    });

    it('should handle single shortcuts', () => {
      expect(createChordedShortcut(['ctrl f'])).toBe('ctrl f');
    });

    it('should filter empty strings', () => {
      expect(createChordedShortcut(['ctrl k', '', 'f6'])).toBe('ctrl k f6');
    });

    it('should handle empty input', () => {
      expect(createChordedShortcut([])).toBe('');
      expect(createChordedShortcut(null as any)).toBe('');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle the osx.json chord examples correctly', () => {
      // Test "ctrl+k f6": "OPEN_TASK_DLG"
      const chordSeq1 = 'ctrl+k f6';
      const normalized1 = harmonizeShortcut(chordSeq1);
      expect(normalized1).toBe('ctrl k f6');
      expect(isChordedShortcut(normalized1)).toBe(true);
      expect(parseChordedShortcut(normalized1)).toEqual(['ctrl', 'k', 'f6']);

      // Test "ctrl+k ctrl+m": "OPEN_MENU"  
      const chordSeq2 = 'ctrl+k ctrl+m';
      const normalized2 = harmonizeShortcut(chordSeq2);
      expect(normalized2).toBe('ctrl k ctrl m');
      expect(isChordedShortcut(normalized2)).toBe(true);
      expect(parseChordedShortcut(normalized2)).toEqual(['ctrl', 'k', 'ctrl', 'm']);
    });

    it('should handle keyboard event sequences for chords', () => {
      // Simulate typing "ctrl+k f6" sequence
      const firstEvent = {key: 'k', ctrlKey: true} as KeyboardEvent;
      const firstChord = createHarmonizedShortcutByKeyboardEvent(firstEvent);
      expect(firstChord).toBe('ctrl k');

      const secondEvent = {key: 'f6'} as KeyboardEvent;
      const secondChord = createHarmonizedShortcutByKeyboardEvent(secondEvent);
      expect(secondChord).toBe('f6');

      // Combined sequence should match osx.json entry
      const combined = createChordedShortcut([firstChord, secondChord]);
      expect(combined).toBe('ctrl k f6');
      expect(harmonizeShortcut('ctrl+k f6')).toBe(combined);
    });
  });
});