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
  private idx = 0;
  private lastUrl = "";

  /**
   * Initializes the browser and page
   */
  async initialize(cwd: string): Promise<void> {
    try {
      this.cwd = cwd;
      console.log('🚀 Launching browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--force-color-profile=srgb',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-gpu-sandbox',
          '--enable-font-antialiasing',
          '--font-render-hinting=medium'
        ]
      });

      await this.initNewPage();

      console.log('✅ Browser initialized successfully');


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ScreenshotError(`Failed to initialize browser: ${errorMessage}`);
    }
  }

  async initNewPage() {
    if (!this.browser) return;
    this.page = await this.browser.newPage();
    await this.page.setViewport(CONFIG.VIEWPORT);

    // Set color scheme preference for better rendering
    await this.page.emulateMediaFeatures([
      {name: 'prefers-color-scheme', value: 'light'}
    ]);
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
      let views = JSON.parse(configData) as ScreenshotConfig[];

      // Validate each configuration entry
      const validatedViews: ScreenshotConfig[] = [];


      const lafs = CONFIG.LOOK_AND_FEELS;
      for (let i = 0; i < views.length; i++) {
        for (let j = 0; j < lafs.length; j++) {
          const laf = lafs[j];
          const view = {...views[i], laf} as ScreenshotConfig;

          let {name, url, shortcuts, actionId} = view;
          if (shortcuts !== undefined && Array.isArray(shortcuts)) {
            shortcuts = ['(CHANGE_LAF_' + laf.toUpperCase() + ')', ...shortcuts];
            validatedViews.push({name, url, shortcuts, laf});
          } else {
            validatedViews.push(view);
          }
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
    const {name, url, shortcuts, laf, actionId} = config;

    await this.initNewPage();
    await this.page.goto(url, {
      waitUntil: "networkidle0", // Wait for network to be idle for better rendering
      timeout: 30000
    });
    // await this.initializeLocalStorage();



    try {
      console.log(`\n📸 Capturing: ${name} → ${url}`);

      // Reset localStorage initialization flag to ensure clean state
      this.localStorageInitialized = false;

      // Check for and click dialog cancel button if it exists
      // try {
      //   const cancelButton = await this.page.$('[data-test-id="dialog-cancel-button"]');
      //   if (cancelButton) {
      //     await cancelButton.click();
      //     console.log('🔄 Clicked dialog cancel button');
      //     await delay(200); // Small delay after clicking
      //   }
      // } catch (error) {
      //   // Silently ignore errors - button might not be clickable or might disappear
      //   console.log('⚠️ Could not click dialog cancel button (this is normal if no dialog is open)');
      // }

      // if (url !== this.lastUrl) {
        // Navigate to the URL with timeout (this refreshes the page for clean state)
      // await this.page.goto(url, {
      //   waitUntil: "networkidle0", // Wait for network to be idle for better rendering
      //   timeout: 30000
      // });
      // } else {
      //   // await this.page.keyboard.up('Escape');
      // }
      this.lastUrl = url;


      // Wait for page scripts to finish loading before localStorage initialization
      // await delay(1000); // Give page scripts time to complete initialization

      // Initialize localStorage after navigation (fresh for each screenshot)
      // await this.initializeLocalStorage();

      if (actionId) {
        await this.executeActionId(actionId);
      } else if (Array.isArray(shortcuts) && shortcuts.length > 0) {
        await this.executeShortcuts(shortcuts, actionIdMapping, name);
      }
      // console.info('actionId done', actionId);
      // console.info('{name, url, shortcuts, laf, actionId}', {name, url, shortcuts, laf, actionId});

      // Wait for content to be visible and UI to settle
      try {
        await this.page.waitForSelector('body', {visible: true, timeout: 5000});
      } catch (selectorError) {
        console.warn('⚠️ Body selector not found, continuing anyway...');
      }

      await delay(CONFIG.DELAYS.BEFORE_SCREENSHOT);

      // Take screenshot
      const screenshotPath = path.join(CONFIG.OUT_DIR, laf);
      // console.info('screenshotPath', screenshotPath)
      const file = path.join(screenshotPath, `${name}.png`) as `${string}.png`;
      // console.info('file', file)
      await fs.mkdir(screenshotPath, {recursive: true});

      await this.page.screenshot({
        path: file,
        fullPage: false // Capture only the viewport
      });
      await delay(CONFIG.DELAYS.BEFORE_SCREENSHOT);

      console.log(`✅ Screenshot saved: ${file}`);
      await this.page.reload();

      // await this.page.keyboard.down('Meta');
      // await this.page.keyboard.press('KeyR');
      // await this.page.keyboard.up('Meta');

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
    console.log('configs', configs);
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
   * Executes an action by actionId using the Call Action dialog
   */
  async executeActionId(actionId: string): Promise<void> {
    if (!this.page) {
      throw new ScreenshotError('Page not initialized');
    }

    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        await this.page.bringToFront();
        console.log(`🎯 Executing actionId: ${actionId} (attempt ${attempt + 1}/${maxRetries + 1})`);

        // Ensure any previous dialogs are closed
        await this.page.keyboard.press('Escape');
        await delay(200);

        // Open dialog by pressing F10
        await this.page.keyboard.press('F10');
        console.log('📂 Call Action dialog opened with F10');

        // Wait for the dialog to appear with timeout
        try {
          await this.page.waitForSelector('input[formcontrolname="target"]', {
            visible: true,
            timeout: 5000 // 5 second timeout instead of default 30 seconds
          });
        } catch (selectorError) {
          console.warn(`⚠️ Dialog selector not found on attempt ${attempt + 1}, retrying...`);
          if (attempt === maxRetries) {
            throw new ScreenshotError(`Dialog input selector not found after ${maxRetries + 1} attempts`);
          }
          attempt++;
          await delay(1000); // Wait before retry
          continue;
        }

        // Clear any existing text and type the actionId
        await this.page.click('input[formcontrolname="target"]');
        await this.page.keyboard.down('Meta'); // Cmd key on Mac
        await this.page.keyboard.press('KeyA'); // Select all
        await this.page.keyboard.up('Meta');
        await this.page.keyboard.press('Backspace'); // Clear
        await this.page.type('input[formcontrolname="target"]', actionId);
        console.log(`⌨️ ActionId entered: ${actionId}`);

        await this.page.screenshot({
          path: path.join(CONFIG.OUT_DIR, 'f10-01-' + this.idx + '.png') as `${string}.png`,
          fullPage: true
        });

        // Press ENTER to confirm and execute the action
        await this.page.keyboard.press('Enter');
        console.log('✅ Action executed (ENTER pressed)');

        // Wait for the action to complete
        await delay(CONFIG.DELAYS.BETWEEN_SHORTCUTS);
        await this.page.screenshot({
          path: path.join(CONFIG.OUT_DIR, 'f10-02-' + this.idx + '.png') as `${string}.png`,
          fullPage: true
        });
        this.idx++;

        // Clean up any remaining dialogs by pressing Escape
        try {
          await this.page.keyboard.press('Escape');
          await delay(200); // Short delay to allow dialog to close
        } catch (error) {
          // Ignore errors from cleanup - dialog might already be closed
        }

        // Success - break out of retry loop
        break;

      } catch (error) {
        if (attempt === maxRetries) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new ScreenshotError(`Failed to execute actionId "${actionId}" after ${maxRetries + 1} attempts: ${errorMessage}`);
        }
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying...`);
        attempt++;
        await delay(1000); // Wait before retry
      }
    }
  }

  /**
   * Initializes localStorage with required values after navigation
   */
  private async initializeLocalStorage(): Promise<void> {
    if (!this.page || this.localStorageInitialized) {
      return;
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 localStorage initialization attempt ${attempt + 1}/${maxRetries}`);

        // Clear localStorage first
        await this.page.evaluate('localStorage.clear()');

        // Set basic localStorage items
        await this.page.evaluate("localStorage.setItem(\"activePanelIndex\", \"1\")");
        await this.page.evaluate("localStorage.setItem(\"theme\", \"light\")");
        await this.page.evaluate("localStorage.setItem(\"fav\", JSON.stringify([\"Users\"]))");

        // Set tabs0 configuration
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

        // Set tabs1 configuration
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

        // Verify that localStorage was set correctly
        const verification = await this.page.evaluate(() => {
          return {
            activePanelIndex: localStorage.getItem("activePanelIndex"),
            theme: localStorage.getItem("theme"),
            fav: localStorage.getItem("fav"),
            tabs0: localStorage.getItem("tabs0"),
            tabs1: localStorage.getItem("tabs1")
          };
        });

        // Check if all required values are present
        if (verification.activePanelIndex === "1" &&
          verification.theme === "light" &&
          verification.fav &&
          verification.tabs0 &&
          verification.tabs1) {

          this.localStorageInitialized = true;
          console.log(`✅ localStorage initialized successfully on attempt ${attempt + 1}`);
          console.info('this.cwd', this.cwd);
          return;
        } else {
          throw new Error(`Verification failed: ${JSON.stringify(verification)}`);
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ localStorage initialization attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries - 1) {
          // Wait before retrying with exponential backoff
          const retryDelay = 500 * Math.pow(2, attempt);
          console.log(`🔄 Retrying in ${retryDelay}ms...`);
          await delay(retryDelay);
        }
      }
    }

    // If all retries failed, throw an error
    const errorMessage = `Failed to initialize localStorage after ${maxRetries} attempts: ${lastError?.message}`;
    console.error('❌ ' + errorMessage);
    throw new ScreenshotError(errorMessage);
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

    await this.page.bringToFront();

    for (const shortcutString of shortcuts) {
      try {
        // Convert ActionId shortcuts to keyboard shortcuts
        const convertedShortcut = convertActionIdShortcuts(shortcutString, actionIdMapping);
        if (convertedShortcut !== shortcutString) {
          console.log(`🔄 Converted shortcut: ${shortcutString} → ${convertedShortcut}`);
        }
        console.log(`⌨️ Triggering shortcut: ${convertedShortcut}`);
        const keySequences = parseShortcutString(convertedShortcut);

        // console.log('keySequences', keySequences);
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