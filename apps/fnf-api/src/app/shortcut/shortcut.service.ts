import {Injectable, Logger} from '@nestjs/common';
import {promises as fs} from 'fs';
import {join} from 'path';

export type ShortcutActionMapping = { [key: string]: string };
export type BrowserOsType = 'osx' | 'windows' | 'linux';

@Injectable()
export class ShortcutService {
  private readonly logger = new Logger(ShortcutService.name);
  private readonly defaultsPath = join(process.cwd(), 'apps/fnf-api/src/assets/shortcut/defaults');
  private readonly customPath = join(process.cwd(), 'apps/fnf-api/src/assets/shortcut/custom');

  /**
   * Get shortcuts for a specific OS, merging defaults with custom shortcuts
   */
  async getShortcuts(os: BrowserOsType): Promise<ShortcutActionMapping> {
    try {
      const defaults = await this.loadDefaults(os);
      const custom = await this.loadCustom(os);

      // Merge defaults with custom shortcuts (custom overrides defaults)
      return {...defaults, ...custom};
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

  private async loadCustom(os: BrowserOsType): Promise<ShortcutActionMapping> {
    try {
      const customFilePath = join(this.customPath, `${os}.json`);
      const content = await fs.readFile(customFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Custom file might not exist, which is fine
      if (error.code === 'ENOENT') {
        return {};
      }
      this.logger.error(`Failed to load custom shortcuts for ${os}:`, error);
      return {};
    }
  }
}