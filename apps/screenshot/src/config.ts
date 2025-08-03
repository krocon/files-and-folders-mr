import {KeyInput} from "puppeteer";
import {ViewportConfig} from "./types.js";

/**
 * Application configuration constants
 */
export const CONFIG = {
  URLS_INPUT_FILE: "./urls.json",
  OUT_DIR: "./screenshots",
  SHORTCUTS_API_URL: "http://localhost:3333/api/shortcuts/osx",
  VIEWPORT: {width: 1024, height: 768} as ViewportConfig,
  DELAYS: {
    BETWEEN_SHORTCUTS: 300,
    BEFORE_SCREENSHOT: 800,
    BETWEEN_KEYS: 100,
  },
} as const;

/**
 * Complete list of valid keyboard keys supported by Puppeteer
 */
export const KEYS: readonly KeyInput[] = [
  "Power", "Eject", "Abort", "Help", "Backspace", "Tab", "Numpad5", "NumpadEnter",
  "Enter", "\r", "\n", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
  "AltLeft", "AltRight", "Pause", "CapsLock", "Escape", "Convert", "NonConvert",
  "Space", "Numpad9", "PageUp", "Numpad3", "PageDown", "End", "Numpad1", "Home",
  "Numpad7", "ArrowLeft", "Numpad4", "Numpad8", "ArrowUp", "ArrowRight", "Numpad6",
  "Numpad2", "ArrowDown", "Select", "Open", "PrintScreen", "Insert", "Numpad0",
  "Delete", "NumpadDecimal", "Digit0", "Digit1", "Digit2", "Digit3", "Digit4",
  "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "MetaLeft", "MetaRight",
  "ContextMenu", "NumpadMultiply", "NumpadAdd", "NumpadSubtract", "NumpadDivide",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23",
  "F24", "NumLock", "ScrollLock", "AudioVolumeMute", "AudioVolumeDown",
  "AudioVolumeUp", "MediaTrackNext", "MediaTrackPrevious", "MediaStop",
  "MediaPlayPause", "Semicolon", "Equal", "NumpadEqual", "Comma", "Minus",
  "Period", "Slash", "Backquote", "BracketLeft", "Backslash", "BracketRight",
  "Quote", "AltGraph", "Props", "Cancel", "Clear", "Shift", "Control", "Alt",
  "Accept", "ModeChange", "Print", "Execute", "Meta", "Attn", "CrSel", "ExSel",
  "EraseEof", "Play", "ZoomOut", "SoftLeft", "SoftRight", "Camera", "Call",
  "EndCall", "VolumeDown", "VolumeUp"
] as const;

/**
 * Modifier keys that should be held down during shortcuts
 */
export const MODIFIER_KEYS: readonly KeyInput[] = ["Shift", "Control", "Alt", "Meta"] as const;

/**
 * Key name mappings from API format to Puppeteer format
 */
export const KEY_MAPPINGS: Record<string, string> = {
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
} as const;