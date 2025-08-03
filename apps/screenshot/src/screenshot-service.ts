import puppeteer, {Browser, Page} from "puppeteer";
import fs from "fs/promises";
import path from "path";
import {ScreenshotConfig, ActionIdMapping} from "./types.js";
import {CONFIG} from "./config.js";
import {
  delay,
  parseShortcutString,
  pressShortcut,
  convertActionIdShortcuts
} from "./shortcut-utils.js";

/**
 * Custom error class for screenshot-related errors
 */
export class ScreenshotError extends Error {
  constructor(message: string, public readonly screenshotName?: string) {
    super(message);
    this.name = 'ScreenshotError';
  }
}

/**
 * Service class for managing screenshot operations
 */
export class ScreenshotService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * Initializes the browser and page
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Launching browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport(CONFIG.VIEWPORT);

      // Clear localStorage for clean state (wrapped in try-catch for security)
      try {
        await this.page.evaluate('localStorage.clear()');
      } catch (error) {
        // localStorage may not be accessible in some contexts (e.g., about:blank)
        console.log('⚠️ Could not clear localStorage (this is normal for some page contexts)');
      }


      console.log('✅ Browser initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ScreenshotError(`Failed to initialize browser: ${errorMessage}`);
    }
  }

  /**
   * Ensures the output directory exists
   */
  async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(CONFIG.OUT_DIR, {recursive: true});
      console.log(`📁 Output directory ensured: ${CONFIG.OUT_DIR}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ScreenshotError(`Failed to create output directory: ${errorMessage}`);
    }
  }

  /**
   * Loads and validates the screenshot configuration file
   */
  async loadConfiguration(): Promise<ScreenshotConfig[]> {
    try {
      console.log(`📋 Loading configuration from ${CONFIG.URLS_INPUT_FILE}...`);

      // Check if file exists
      try {
        await fs.access(CONFIG.URLS_INPUT_FILE);
      } catch {
        throw new ScreenshotError(`Configuration file not found: ${CONFIG.URLS_INPUT_FILE}`);
      }

      const configData = await fs.readFile(CONFIG.URLS_INPUT_FILE, "utf-8");

      if (!configData.trim()) {
        throw new ScreenshotError('Configuration file is empty');
      }

      let views: unknown;
      try {
        views = JSON.parse(configData);
      } catch (parseError) {
        throw new ScreenshotError('Configuration file contains invalid JSON');
      }

      if (!Array.isArray(views)) {
        throw new ScreenshotError('Configuration must be an array of screenshot configs');
      }

      // Validate each configuration entry
      const validatedViews: ScreenshotConfig[] = [];
      for (let i = 0; i < views.length; i++) {
        const view = views[i];

        if (!view || typeof view !== 'object') {
          console.warn(`⚠️ Skipping invalid config entry at index ${i}: not an object`);
          continue;
        }

        const {name, url, shortcuts} = view as Partial<ScreenshotConfig>;

        if (!name || typeof name !== 'string') {
          console.warn(`⚠️ Skipping config entry at index ${i}: missing or invalid name`);
          continue;
        }

        if (!url || typeof url !== 'string') {
          console.warn(`⚠️ Skipping config entry at index ${i}: missing or invalid URL`);
          continue;
        }

        // Validate URL format
        try {
          new URL(url);
        } catch {
          console.warn(`⚠️ Skipping config entry "${name}": invalid URL format`);
          continue;
        }

        // Validate shortcuts if provided
        if (shortcuts !== undefined) {
          if (!Array.isArray(shortcuts)) {
            console.warn(`⚠️ Config entry "${name}": shortcuts must be an array, skipping shortcuts`);
            validatedViews.push({name, url});
            continue;
          }

          const validShortcuts = shortcuts.filter(shortcut => {
            if (typeof shortcut !== 'string') {
              console.warn(`⚠️ Config entry "${name}": skipping non-string shortcut`);
              return false;
            }
            return true;
          });

          validatedViews.push({name, url, shortcuts: validShortcuts});
        } else {
          validatedViews.push({name, url});
        }
      }

      if (validatedViews.length === 0) {
        throw new ScreenshotError('No valid screenshot configurations found');
      }

      console.log(`✅ Loaded ${validatedViews.length} valid screenshot configurations`);
      return validatedViews;

    } catch (error) {
      if (error instanceof ScreenshotError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ScreenshotError(`Failed to load configuration: ${errorMessage}`);
    }
  }

  /**
   * Executes shortcuts for a given screenshot configuration
   */
  private async executeShortcuts(
    shortcuts: string[],
    actionIdMapping: ActionIdMapping,
    screenshotName: string
  ): Promise<void> {
    if (!this.page) {
      throw new ScreenshotError('Page not initialized', screenshotName);
    }

    for (const shortcutString of shortcuts) {
      try {
        // Convert ActionId shortcuts to keyboard shortcuts
        const convertedShortcut = convertActionIdShortcuts(shortcutString, actionIdMapping);

        if (convertedShortcut !== shortcutString) {
          console.log(`🔄 Converted shortcut: ${shortcutString} → ${convertedShortcut}`);
        }

        console.log(`⌨️ Triggering shortcut: ${convertedShortcut}`);

        const keySequences = parseShortcutString(convertedShortcut);

        for (const sequence of keySequences) {
          await pressShortcut(this.page, sequence);
          await delay(CONFIG.DELAYS.BETWEEN_SHORTCUTS);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Failed to execute shortcut "${shortcutString}" for ${screenshotName}: ${errorMessage}`);
        // Continue with other shortcuts instead of failing completely
      }
    }
  }

  /**
   * Captures a single screenshot based on the provided configuration
   */
  async captureScreenshot(
    config: ScreenshotConfig,
    actionIdMapping: ActionIdMapping
  ): Promise<void> {
    if (!this.page) {
      throw new ScreenshotError('Page not initialized', config.name);
    }

    const {name, url, shortcuts} = config;

    try {
      console.log(`📸 Capturing: ${name} → ${url}`);

      // Navigate to the URL with timeout
      await this.page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000 // 30 second timeout
      });

      // Execute shortcuts if provided
      if (Array.isArray(shortcuts) && shortcuts.length > 0) {
        await this.executeShortcuts(shortcuts, actionIdMapping, name);
      }

      // Wait for UI to settle
      await delay(CONFIG.DELAYS.BEFORE_SCREENSHOT);

      // Take screenshot
      const screenshotPath = path.join(CONFIG.OUT_DIR, `${name}.png`) as `${string}.png`;
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: false // Capture only the viewport
      });

      console.log(`✅ Screenshot saved: ${screenshotPath}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ScreenshotError(`Failed to capture screenshot "${name}": ${errorMessage}`, name);
    }
  }

  /**
   * Captures multiple screenshots based on the provided configurations
   */
  async captureScreenshots(
    configs: ScreenshotConfig[],
    actionIdMapping: ActionIdMapping
  ): Promise<void> {
    if (!configs || configs.length === 0) {
      throw new ScreenshotError('No screenshot configurations provided');
    }

    const results: { name: string; success: boolean; error?: string }[] = [];

    for (const config of configs) {
      try {
        await this.captureScreenshot(config, actionIdMapping);
        results.push({name: config.name, success: true});
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to capture ${config.name}: ${errorMessage}`);
        results.push({name: config.name, success: false, error: errorMessage});
      }
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Screenshot Summary:`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log(`\n❌ Failed screenshots:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
  }

  /**
   * Closes the browser and cleans up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log('🧹 Browser closed successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Error during cleanup: ${errorMessage}`);
    }
  }
}