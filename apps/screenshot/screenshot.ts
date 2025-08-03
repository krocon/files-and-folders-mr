import puppeteer, {Browser, Page, KeyInput} from "puppeteer";
import fs from "fs/promises";
import fetch from "node-fetch";

// Type definitions
interface ViewportConfig {
  width: number;
  height: number;
}

interface ScreenshotConfig {
  name: string;
  url: string;
  shortcuts?: string[];
}

type KeyboardKey = KeyInput;

// Constants
const URLS_INPUT_FILE = "./urls.json";
const OUT_DIR = "./screenshots";
const VIEWPORT: ViewportConfig = {width: 1024, height: 768};
const SHORTCUTS_API_URL = "http://localhost:3333/api/shortcuts/osx";

const KEYS: readonly KeyInput[] = [
  "Power", "Eject", "Abort", "Help", "Backspace", "Tab", "Numpad5", "NumpadEnter", "Enter", "\r", "\n", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "Pause", "CapsLock", "Escape", "Convert", "NonConvert", "Space", "Numpad9", "PageUp", "Numpad3", "PageDown", "End", "Numpad1", "Home", "Numpad7", "ArrowLeft", "Numpad4", "Numpad8", "ArrowUp", "ArrowRight", "Numpad6", "Numpad2", "ArrowDown", "Select", "Open", "PrintScreen", "Insert", "Numpad0", "Delete", "NumpadDecimal", "Digit0", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "MetaLeft", "MetaRight", "ContextMenu", "NumpadMultiply", "NumpadAdd", "NumpadSubtract", "NumpadDivide", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24", "NumLock", "ScrollLock", "AudioVolumeMute", "AudioVolumeDown", "AudioVolumeUp", "MediaTrackNext", "MediaTrackPrevious", "MediaStop", "MediaPlayPause", "Semicolon", "Equal", "NumpadEqual", "Comma", "Minus", "Period", "Slash", "Backquote", "BracketLeft", "Backslash", "BracketRight", "Quote", "AltGraph", "Props", "Cancel", "Clear", "Shift", "Control", "Alt", "Accept", "ModeChange", "Print", "Execute", "Meta", "Attn", "CrSel", "ExSel", "EraseEof", "Play", "ZoomOut", "SoftLeft", "SoftRight", "Camera", "Call", "EndCall", "VolumeDown", "VolumeUp"
] as const;

/**
 * Parses a parenthesized shortcut string into key sequences
 * Example: "(Control|Meta|g)(Users)(Enter)" -> [["Control", "Meta", "g"], ["Users"], ["Enter"]]
 */
function parseShortcutString(shortcutString: string): KeyInput[][] {
  const sequences: KeyInput[][] = [];
  const regex = /\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(shortcutString)) !== null) {
    const keys = match[1].split('|').map(key => key.trim() as KeyInput);
    sequences.push(keys);
  }

  return sequences;
}

/**
 * Handles keyboard key press, either as a modifier (held down) or a regular key press
 */
async function handleKey(
  modifiers: readonly KeyboardKey[],
  key: KeyboardKey,
  page: Page,
  held: KeyboardKey[]
): Promise<void> {
  if (modifiers.includes(key)) {
    await page.keyboard.down(key);
    held.push(key);
  } else {
    await page.keyboard.press(key);
  }
}

/**
 * Executes a keyboard shortcut sequence on the given page
 */
async function pressShortcut(page: Page, shortcut: readonly KeyboardKey[]): Promise<void> {
  const modifiers: readonly KeyboardKey[] = ["Shift", "Control", "Alt", "Meta"];
  const held: KeyboardKey[] = [];

  for (const key of shortcut) {
    if (key.length > 2 && !KEYS.includes(key)) {
      // Handle multi-character strings as individual key presses
      const keys: string[] = key.split("");
      for (const k of keys) {
        await handleKey(modifiers, k as KeyInput, page, held);
      }
      await new Promise<void>(resolve => setTimeout(resolve, 100));
    } else {
      await handleKey(modifiers, key, page, held);
    }
  }

  // Release held modifier keys in reverse order
  for (const key of held.reverse()) {
    await page.keyboard.up(key);
  }
}


function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * Loads the shortcut mapping from the API endpoint
 */
async function loadShortcutMapping(): Promise<Record<string, string>> {
  try {
    const response = await fetch(SHORTCUTS_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch shortcuts: ${response.status} ${response.statusText}`);
    }
    return await response.json() as Record<string, string>;
  } catch (error) {
    console.warn(`⚠️ Failed to load shortcut mapping from ${SHORTCUTS_API_URL}:`, error);
    return {};
  }
}

/**
 * Creates a reverse lookup mapping from ActionId to keyboard shortcut
 */
function createActionIdToShortcutMapping(shortcutMapping: Record<string, string>): Record<string, string> {
  const reverseMapping: Record<string, string> = {};
  for (const [shortcut, actionId] of Object.entries(shortcutMapping)) {
    reverseMapping[actionId] = shortcut;
  }
  return reverseMapping;
}

/**
 * Normalizes key names from API format to Puppeteer format
 * Examples: "ctrl" -> "Control", "cmd" -> "Meta", "alt" -> "Alt"
 */
function normalizeKeyName(key: string): string {
  const keyMappings: Record<string, string> = {
    'ctrl': 'Control',
    'cmd': 'Meta',
    'alt': 'Alt',
    'shift': 'Shift',
    'space': 'Space',
    'enter': 'Enter',
    'tab': 'Tab',
    'up': 'ArrowUp',
    'down': 'ArrowDown',
    'left': 'ArrowLeft',
    'right': 'ArrowRight',
    'delete': 'Delete',
    'plus': 'Equal', // + key
    'minus': 'Minus', // - key
    'ø': 'ø' // Special character
  };

  // Handle function keys (f1, f2, etc.)
  if (/^f\d+$/i.test(key)) {
    return key.toUpperCase();
  }

  return keyMappings[key.toLowerCase()] || key;
}

/**
 * Converts a keyboard shortcut string from API format to Puppeteer format
 * Example: "ctrl cmd g" -> "Control|Meta|g"
 */
function convertShortcutFormat(shortcut: string): string {
  const keys = shortcut.split(' ').map(key => normalizeKeyName(key.trim()));
  return keys.join('|');
}

/**
 * Converts ActionId shortcuts to keyboard shortcuts using the mapping
 * Example: "(OPEN_COPY_DLG)(Users)(Enter)" -> "(Control|Meta|c)(Users)(Enter)"
 */
function convertActionIdShortcuts(shortcutString: string, actionIdMapping: Record<string, string>): string {
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
}

/**
 * Main function that orchestrates the screenshot taking process
 */
async function run(): Promise<void> {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUT_DIR, {recursive: true});

    // Load shortcut mapping from API
    console.log(`🔗 Loading shortcut mapping from ${SHORTCUTS_API_URL}...`);
    const shortcutMapping = await loadShortcutMapping();
    const actionIdMapping = createActionIdToShortcutMapping(shortcutMapping);
    console.log(`✅ Loaded ${Object.keys(actionIdMapping).length} ActionId mappings`);

    // Read and parse the configuration file
    const configData: string = await fs.readFile(URLS_INPUT_FILE, "utf-8");
    const views: ScreenshotConfig[] = JSON.parse(configData);

    // Launch browser and create page
    const browser: Browser = await puppeteer.launch();
    const page: Page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    // Process each screenshot configuration
    for (const {name, url, shortcuts} of views) {
      console.log(`📸 Capturing: ${name} → ${url}`);
      await page.goto(url, {waitUntil: "networkidle2"});

      // Execute shortcuts if provided
      if (Array.isArray(shortcuts)) {
        for (const shortcutString of shortcuts) {
          // Convert ActionId shortcuts to keyboard shortcuts
          const convertedShortcut = convertActionIdShortcuts(shortcutString, actionIdMapping);
          if (convertedShortcut !== shortcutString) {
            console.log(`🔄 Converted shortcut: ${shortcutString} → ${convertedShortcut}`);
          }

          console.log(`⌨️ Triggering shortcut: ${convertedShortcut}`);
          const keySequences = parseShortcutString(convertedShortcut);
          for (const sequence of keySequences) {
            await pressShortcut(page, sequence);
            await delay(300);
          }
        }
      }

      // Wait for UI to settle and take screenshot
      await delay(800);
      await page.screenshot({path: `${OUT_DIR}/${name}.png`});
    }

    await browser.close();
    console.log("✅ All screenshots saved.");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Execute the main function
run().catch((err: Error) => {
  console.error("❌ Error:", err);
  process.exit(1);
});