import puppeteer, {Browser, Page} from "puppeteer";
import fs from "fs/promises";
import path from "path";
import {ActionIdMapping, ScreenshotConfig} from "./types.js";
import {CONFIG} from "./config.js";
import {convertActionIdShortcuts, delay, parseShortcutString, pressShortcut} from "./shortcut-utils.js";

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
  private localStorageInitialized: boolean = false;
  private cwd: string = '';

  /**
   * Initializes the browser and page
   */
  async initialize(cwd: string): Promise<void> {
    try {
      this.cwd = cwd;
      console.log('🚀 Launching browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport(CONFIG.VIEWPORT);

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
      await fs.access(CONFIG.URLS_INPUT_FILE);
      const configData = await fs.readFile(CONFIG.URLS_INPUT_FILE, "utf-8");
      let views = JSON.parse(configData);

      // Validate each configuration entry
      const validatedViews: ScreenshotConfig[] = [];
      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        const {name, url, shortcuts} = view;

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

      // Initialize localStorage after navigation (only once)
      await this.initializeLocalStorage();

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

  /**
   * Initializes localStorage with required values after navigation
   */
  private async initializeLocalStorage(): Promise<void> {
    if (!this.page || this.localStorageInitialized) {
      return;
    }

    try {
      await this.page.evaluate('localStorage.clear()');

      await this.page.evaluate("localStorage.setItem(\"activePanelIndex\", \"1\")");
      await this.page.evaluate("localStorage.setItem(\"theme\", \"light\")");
      await this.page.evaluate("localStorage.setItem(\"fav\", JSON.stringify([\"Users\"]))");

      const t0 = {
        "panelIndex": 0, "tabs": [
          {
            "path": this.cwd,
            "history": ["/Users", this.cwd],
            "filterActive": false,
            "hiddenFilesVisible": false,
            "filterText": "",
            "id": 10,
            "historyIndex": 0
          },
          {
            "path": "/Users",
            "history": ["/Users"],
            "filterActive": false,
            "hiddenFilesVisible": false,
            "filterText": "",
            "id": 11,
            "historyIndex": 0
          }
        ], "selectedTabIndex": 1
      };
      const tabs0Json = JSON.stringify(t0).replace(/"/g, '\\"');
      await this.page.evaluate(`localStorage.setItem("tabs0", "${tabs0Json}")`);

      const t1 = {
        "panelIndex": 1, "tabs": [
          {
            "path": this.cwd + "/screenshots",
            "history": ["/Users", this.cwd],
            "filterActive": false,
            "hiddenFilesVisible": false,
            "filterText": "",
            "id": 25,
            "historyIndex": 0
          }
        ], "selectedTabIndex": 0
      };
      const tabs1Json = JSON.stringify(t1).replace(/"/g, '\\"');
      await this.page.evaluate(`localStorage.setItem("tabs1", "${tabs1Json}")`);

      this.localStorageInitialized = true;
      console.log('✅ localStorage initialized successfully');

    } catch (error) {
      // localStorage may not be accessible in some contexts
      console.log('⚠️ Could not initialize localStorage:', error);
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
}