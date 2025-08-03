import {KeyInput} from "puppeteer";

/**
 * Configuration for browser viewport dimensions
 */
export interface ViewportConfig {
  width: number;
  height: number;
}

/**
 * Configuration for a single screenshot capture
 */
export interface ScreenshotConfig {
  name: string;
  url: string;
  shortcuts?: string[];
}

/**
 * Type alias for keyboard key input
 */
export type KeyboardKey = KeyInput;

/**
 * Mapping of shortcut strings to ActionIds
 */
export type ShortcutMapping = Record<string, string>;

/**
 * Mapping of ActionIds to keyboard shortcuts
 */
export type ActionIdMapping = Record<string, string>;