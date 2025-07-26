import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {environment} from "../../../environments/environment";
import {BrowserOsType, ShortcutActionMapping} from "@fnf-data";


@Injectable()
export class ShortcutService {

  private readonly logger = new Logger(ShortcutService.name);
  private readonly defaultsPath = environment.shortcutsDefaultsPath;
  private readonly customPath = environment.shortcutsCustomPath;

  /**
   * Get shortcuts for a specific OS, merging defaults with custom shortcuts
   */
  async getShortcuts(os: BrowserOsType): Promise<ShortcutActionMapping> {
    try {

      const custom = await this.loadCustom(os);
      if (custom) {
        return custom;
      }
      // no custom, load defaults:
      return await this.loadDefaults(os);

    } catch (error) {
      this.logger.error(`Failed to get shortcuts for ${os}:`, error);
      throw error;
    }
  }

  /**
   * Save custom shortcuts for a specific OS
   */
  async saveShortcuts(os: BrowserOsType, shortcuts: ShortcutActionMapping): Promise<void> {
    try {
      const customFilePath = join(this.customPath, `${os}.json`);

      // Create custom file from defaults if it doesn't exist
      const defaultFilePath = join(this.defaultsPath, `${os}.json`);
      try {
        const exists = existsSync(customFilePath);
        if (!exists) {
          this.logger.warn(`Create custom file from defaults for ${os}...`);
          await fs.copyFile(defaultFilePath, customFilePath);
        }
      } catch {
        this.logger.error(`Failed to copy file: `, defaultFilePath, customFilePath);
      }

      await fs.writeFile(customFilePath, JSON.stringify(shortcuts, null, 2));
      this.logger.log(`Saved custom shortcuts for ${os}`);
    } catch (error) {
      this.logger.error(`Failed to save shortcuts for ${os}:`, error);
      throw error;
    }
  }

  /**
   * Reset shortcuts to defaults by removing custom shortcuts
   */
  async resetToDefaults(os: BrowserOsType): Promise<ShortcutActionMapping> {
    try {
      const customFilePath = join(this.customPath, `${os}.json`);

      // Remove custom file if it exists
      try {
        await fs.unlink(customFilePath);
        this.logger.log(`Removed custom shortcuts for ${os}`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return await this.loadDefaults(os);
    } catch (error) {
      this.logger.error(`Failed to reset shortcuts for ${os}:`, error);
      throw error;
    }
  }

  /**
   * Get default shortcuts for a specific OS
   */
  async getDefaults(os: BrowserOsType): Promise<ShortcutActionMapping> {
    return await this.loadDefaults(os);
  }

  private async loadDefaults(os: BrowserOsType): Promise<ShortcutActionMapping> {
    try {
      const defaultFilePath = join(this.defaultsPath, `${os}.json`);
      const content = await fs.readFile(defaultFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to load default shortcuts for ${os}:`, error);
      return {};
    }
  }

  private async loadCustom(os: BrowserOsType): Promise<ShortcutActionMapping | null> {
    try {
      const customFilePath = join(this.customPath, `${os}.json`);
      const content = await fs.readFile(customFilePath, 'utf-8');
      return JSON.parse(content);

    } catch (error) {
      // Custom file might not exist, which is fine
      if (error.code === 'ENOENT') {
        return null;
      }
      this.logger.error(`Failed to load custom shortcuts for ${os}:`, error);
      return null;
    }
  }
}