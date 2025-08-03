import puppeteer, {Browser, Page, KeyInput} from "puppeteer";
import fs from "fs/promises";

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
 * Main function that orchestrates the screenshot taking process
 */
async function run(): Promise<void> {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUT_DIR, {recursive: true});

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
          console.log(`⌨️ Triggering shortcut: ${shortcutString}`);
          const keySequences = parseShortcutString(shortcutString);
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