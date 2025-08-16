import {KeyInput, Page} from "puppeteer";
import {ActionIdMapping, KeyboardKey} from "./types.js";
import {CONFIG, KEY_MAPPINGS, KEYS, MODIFIER_KEYS} from "./config.js";

/**
 * Utility function to create a delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * Parses a parenthesized shortcut string into key sequences
 * Example: "(Control|Meta|g)(Users)(Enter)" -> [["Control", "Meta", "g"], ["Users"], ["Enter"]]
 */
export function parseShortcutString(shortcutString: string): KeyInput[][] {
  if (!shortcutString || typeof shortcutString !== 'string') {
    throw new Error('Invalid shortcut string provided');
  }

  const sequences: KeyInput[][] = [];
  const regex = /\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(shortcutString)) !== null) {
    const keys = match[1].split('|').map(key => {
      const trimmedKey = key.trim();
      if (!trimmedKey) {
        throw new Error(`Empty key found in shortcut: ${shortcutString}`);
      }
      return trimmedKey as KeyInput;
    });
    sequences.push(keys);
  }

  if (sequences.length === 0) {
    throw new Error(`No valid key sequences found in shortcut: ${shortcutString}`);
  }

  return sequences;
}

/**
 * Handles keyboard key press, either as a modifier (held down) or a regular key press
 */
export async function handleKey(
  modifiers: readonly KeyboardKey[],
  key: KeyboardKey,
  page: Page,
  held: KeyboardKey[]
): Promise<void> {
  if (!page) {
    throw new Error('Page instance is required');
  }

  if (!key) {
    throw new Error('Key is required');
  }

  try {
    if (modifiers.includes(key)) {
      await page.keyboard.down(key);
      held.push(key);
    } else {
      await page.keyboard.press(key);
    }
  } catch (error) {
    throw new Error(`Failed to handle key "${key}": ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Executes a keyboard shortcut sequence on the given page
 */
export async function pressShortcut(page: Page, shortcut: readonly KeyboardKey[]): Promise<void> {
  if (!page) {
    throw new Error('Page instance is required');
  }

  if (!shortcut || shortcut.length === 0) {
    throw new Error('Shortcut sequence is required');
  }

  const held: KeyboardKey[] = [];

  try {
    for (const key of shortcut) {
      if (key.length > 2 && !KEYS.includes(key)) {
        // Handle multi-character strings as individual key presses
        const keys: string[] = key.split("");
        for (const k of keys) {
          await handleKey(MODIFIER_KEYS, k as KeyInput, page, held);
        }
        await delay(CONFIG.DELAYS.BETWEEN_KEYS);
      } else {
        await handleKey(MODIFIER_KEYS, key, page, held);
      }
    }

    // Release held modifier keys in reverse order
    for (const key of held.reverse()) {
      await page.keyboard.up(key);
    }
  } catch (error) {
    // Ensure all held keys are released even if an error occurs
    for (const key of held.reverse()) {
      try {
        await page.keyboard.up(key);
      } catch (releaseError) {
        console.warn(`Failed to release key "${key}":`, releaseError);
      }
    }
    throw error;
  }
}

/**
 * Normalizes key names from API format to Puppeteer format
 * Examples: "ctrl" -> "Control", "cmd" -> "Meta", "alt" -> "Alt"
 */
export function normalizeKeyName(key: string): string {
  if (!key || typeof key !== 'string') {
    throw new Error('Key name must be a non-empty string');
  }

  // Handle function keys (f1, f2, etc.)
  if (/^f\d+$/i.test(key)) {
    return key.toUpperCase();
  }

  const normalizedKey = KEY_MAPPINGS[key.toLowerCase()];
  return normalizedKey || key;
}

/**
 * Converts a keyboard shortcut string from API format to Puppeteer format
 * Example: "ctrl cmd g" -> "Control|Meta|g"
 */
export function convertShortcutFormat(shortcut: string): string {
  if (!shortcut || typeof shortcut !== 'string') {
    throw new Error('Shortcut must be a non-empty string');
  }

  const keys = shortcut.split(' ')
    .map(key => key.trim())
    .filter(key => key.length > 0)
    .map(key => normalizeKeyName(key));

  if (keys.length === 0) {
    throw new Error(`No valid keys found in shortcut: ${shortcut}`);
  }

  return keys.join('|');
}

/**
 * Converts ActionId shortcuts to keyboard shortcuts using the mapping
 * Example: "(OPEN_COPY_DLG)(Users)(Enter)" -> "(Control|Meta|c)(Users)(Enter)"
 */
export function convertActionIdShortcuts(shortcutString: string, actionIdMapping: ActionIdMapping): string {
  if (!shortcutString) {
    throw new Error('Shortcut string must be a non-empty string');
  }

  if (!actionIdMapping || typeof actionIdMapping !== 'object') {
    throw new Error('ActionId mapping must be a valid object');
  }

  try {
    return shortcutString.replace(/\(([^)]+)\)/g, (match, content) => {
      // Check if this is an ActionId that needs conversion
      if (actionIdMapping[content]) {
        const keyboardShortcut = actionIdMapping[content];
        const convertedShortcut = convertShortcutFormat(keyboardShortcut);
        return `(${convertedShortcut})`;
      }
      // If not an ActionId, return as-is
      return match;
    });
  } catch (error) {
    throw new Error(`Failed to convert ActionId shortcuts: ${error instanceof Error ? error.message : String(error)}`);
  }
}