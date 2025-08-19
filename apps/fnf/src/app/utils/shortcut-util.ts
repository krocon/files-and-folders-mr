/**
 * Custom shortcut utility functions to replace @guiexpert/table implementations
 * These functions handle the new chord syntax properly:
 * - "ctrl+k f6" => keydown: ctrl and k, keyup, keydown: f6, keyup
 * - "ctrl+k ctrl+m" => keydown:ctrl k, keyup, keydown: ctrl m, keyup
 * - "f6" => keydown: f6, keyup
 * - "ctrl+m" => keydown: ctrl m, keyup
 */

/**
 * Normalizes shortcut strings to a consistent format
 * Handles both single shortcuts and chord sequences
 *
 * @param shortcut The shortcut string to harmonize
 * @returns Normalized shortcut string
 */
export function harmonizeShortcut(shortcut: string): string {
  if (!shortcut) {
    return '';
  }

  // Split on spaces to handle chord sequences like "ctrl+k f6"
  const chordParts = shortcut.trim().split(/\s+/);

  // Process each chord part
  const harmonizedParts = chordParts.map(part => {
    // Split by + and normalize each component
    const components = part.toLowerCase()
      .split('+')
      .map(comp => comp.trim())
      .filter(comp => comp.length > 0);

    // Sort modifiers to ensure consistent order: ctrl, alt, shift, cmd/meta, then key
    const modifierOrder = ['ctrl', 'alt', 'shift', 'cmd', 'meta'];
    const modifiers: string[] = [];
    const keys: string[] = [];

    components.forEach(comp => {
      if (modifierOrder.includes(comp)) {
        modifiers.push(comp);
      } else {
        keys.push(comp);
      }
    });

    // Sort modifiers according to the defined order
    modifiers.sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b));

    // Combine modifiers and keys
    return [...modifiers, ...keys].join(' ');
  });

  // Join chord parts with spaces
  return harmonizedParts.join(' ');
}

/**
 * Creates a harmonized shortcut string from a keyboard event
 * This handles individual keystrokes that are part of a chord sequence
 *
 * @param keyboardEvent The keyboard event to process
 * @returns Harmonized shortcut string for this specific keystroke
 */
export function createHarmonizedShortcutByKeyboardEvent(keyboardEvent: KeyboardEvent): string {
  if (!keyboardEvent) {
    return '';
  }

  const modifiers: string[] = [];

  // Check for modifier keys in consistent order
  if (keyboardEvent.ctrlKey) modifiers.push('ctrl');
  if (keyboardEvent.altKey) modifiers.push('alt');
  if (keyboardEvent.shiftKey) modifiers.push('shift');
  if (keyboardEvent.metaKey) modifiers.push('cmd');

  // Get the key, normalizing it
  let key = keyboardEvent.key.toLowerCase();

  // Filter out modifier keys themselves when they're the main key
  const modifierKeys = ['control', 'alt', 'shift', 'meta', 'cmd'];
  if (modifierKeys.includes(key)) {
    // If only a modifier key was pressed, don't create a shortcut
    return '';
  }

  // Handle special key mappings
  const keyMappings: { [key: string]: string } = {
    ' ': 'space',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right',
    'escape': 'esc',
    'delete': 'del'
  };

  if (keyMappings[key]) {
    key = keyMappings[key];
  }

  // Combine modifiers and key
  const components = [...modifiers, key].filter(comp => comp.length > 0);

  return components.join(' ');
}

/**
 * Checks if a shortcut string represents a chorded shortcut
 * A chorded shortcut contains multiple space-separated shortcut parts
 *
 * @param shortcut The shortcut string to check
 * @returns true if it's a chorded shortcut
 */
export function isChordedShortcut(shortcut: string): boolean {
  if (!shortcut || typeof shortcut !== 'string') {
    return false;
  }

  // Split by spaces and filter out empty parts
  const parts = shortcut.trim().split(/\s+/).filter(part => part.length > 0);

  // A chord requires at least 2 parts
  if (parts.length < 2) {
    return false;
  }

  // Check if we have multiple distinct shortcut parts
  // Each part should be a valid shortcut (contain at least one non-modifier)
  const modifierKeywords = ['ctrl', 'alt', 'shift', 'cmd', 'meta'];

  let validShortcutParts = 0;
  for (const part of parts) {
    const components = part.split(/[\s+]/).filter(comp => comp.length > 0);
    const hasNonModifier = components.some(comp => !modifierKeywords.includes(comp.toLowerCase()));
    if (hasNonModifier) {
      validShortcutParts++;
    }
  }

  return validShortcutParts >= 2;
}

/**
 * Parses a chorded shortcut string into its individual shortcut parts
 *
 * @param chordedShortcut The chorded shortcut string
 * @returns Array of individual shortcut strings
 */
export function parseChordedShortcut(chordedShortcut: string): string[] {
  if (!chordedShortcut || typeof chordedShortcut !== 'string') {
    return [];
  }

  return chordedShortcut.trim().split(/\s+/).filter(part => part.length > 0);
}

/**
 * Creates a chorded shortcut string from an array of individual shortcuts
 *
 * @param shortcuts Array of individual shortcut strings
 * @returns Combined chorded shortcut string
 */
export function createChordedShortcut(shortcuts: string[]): string {
  if (!shortcuts || shortcuts.length === 0) {
    return '';
  }

  return shortcuts.filter(shortcut => shortcut && shortcut.length > 0).join(' ');
}