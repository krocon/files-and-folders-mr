#!/usr/bin/env node

import {ApiError, createActionIdToShortcutMapping, loadShortcutMapping} from "./api-client.js";
import {ScreenshotService} from "./screenshot-service.js";
import * as console from "node:console";

const cwd = process.cwd();



class ScreenshotApp {
  private screenshotService: ScreenshotService;

  constructor() {
    this.screenshotService = new ScreenshotService();
  }


  async run(): Promise<void> {
    let exitCode = 0;

    try {
      console.log('🎬 Starting screenshot application...');

      // Initialize screenshot service
      await this.screenshotService.initialize(cwd);
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

      const configs = await this.screenshotService.loadConfiguration();
      await this.screenshotService.captureScreenshots(configs, actionIdMapping);

      console.log('✅ Screenshot application completed successfully');

    } catch (error) {
      exitCode = 1;
      console.error(`❌ Screenshot Error: ${error}`);

    } finally {
      // Always cleanup resources
      await this.screenshotService.cleanup();

      if (exitCode !== 0) {
        process.exit(exitCode);
      }
    }
  }
}


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


process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});


new ScreenshotApp()
  .run()
  .catch((error: Error) => {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  });