#!/usr/bin/env node

import {loadShortcutMapping, createActionIdToShortcutMapping, ApiError} from "./api-client.js";
import {ScreenshotService, ScreenshotError} from "./screenshot-service.js";

/**
 * Main application class that orchestrates the screenshot taking process
 */
class ScreenshotApp {
  private screenshotService: ScreenshotService;

  constructor() {
    this.screenshotService = new ScreenshotService();
  }

  /**
   * Main execution function
   */
  async run(): Promise<void> {
    let exitCode = 0;

    try {
      console.log('🎬 Starting screenshot application...');

      // Initialize screenshot service
      await this.screenshotService.initialize();
      await this.screenshotService.ensureOutputDirectory();

      // Load shortcut mapping from API
      let actionIdMapping: Record<string, string> = {};
      try {
        const shortcutMapping = await loadShortcutMapping();
        actionIdMapping = createActionIdToShortcutMapping(shortcutMapping);
      } catch (error) {
        if (error instanceof ApiError) {
          console.warn('⚠️ Continuing without shortcut mapping due to API error');
          // Continue execution without shortcut mapping
        } else {
          throw error;
        }
      }

      // Load screenshot configurations
      const configs = await this.screenshotService.loadConfiguration();

      // Capture screenshots
      await this.screenshotService.captureScreenshots(configs, actionIdMapping);

      console.log('✅ Screenshot application completed successfully');

    } catch (error) {
      exitCode = 1;

      if (error instanceof ScreenshotError) {
        console.error(`❌ Screenshot Error: ${error.message}`);
        if (error.screenshotName) {
          console.error(`   Screenshot: ${error.screenshotName}`);
        }
      } else if (error instanceof ApiError) {
        console.error(`❌ API Error: ${error.message}`);
        if (error.statusCode) {
          console.error(`   Status Code: ${error.statusCode}`);
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Unexpected Error: ${errorMessage}`);

        // Log stack trace for debugging in development
        if (process.env.NODE_ENV === 'development' && error instanceof Error && error.stack) {
          console.error('Stack trace:', error.stack);
        }
      }
    } finally {
      // Always cleanup resources
      await this.screenshotService.cleanup();

      if (exitCode !== 0) {
        process.exit(exitCode);
      }
    }
  }
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error.message);
  if (process.env.NODE_ENV === 'development' && error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  console.error('❌ Unhandled Rejection:', errorMessage);
  if (process.env.NODE_ENV === 'development' && reason instanceof Error && reason.stack) {
    console.error('Stack trace:', reason.stack);
  }
  process.exit(1);
});

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Execute the application
const app = new ScreenshotApp();
app.run().catch((error: Error) => {
  console.error('❌ Fatal Error:', error.message);
  process.exit(1);
});