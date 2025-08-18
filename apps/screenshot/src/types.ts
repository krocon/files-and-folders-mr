import {KeyInput} from "puppeteer";

/**
 * Configuration for browser viewport dimensions and rendering properties
 */
export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  isLandscape?: boolean;
}

/**
 * Configuration for a single screenshot capture
 */
export interface ScreenshotConfig {
  laf: string;
  name: string;
  url: string;
  actionId?: string;
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