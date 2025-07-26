import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {environment} from "../../../environments/environment";
import {ColorData} from "@fnf-data";


@Injectable()
export class ColorService {

  private readonly logger = new Logger(ColorService.name);
  private readonly defaultsPath = environment.colorDefaultsPath;
  private readonly customPath = environment.colorCustomPath;


  async getCustomNames(): Promise<string[]> {
    try {
      const names: string[] = await fs.readdir(this.customPath);
      return names.map(name => name.replace('.json', ''));
    } catch (error) {
      this.logger.error(`Failed to get custom color names:`, error);
      throw error;
    }
  }

  async getDefaultNames(): Promise<string[]> {
    try {
      const names: string[] = await fs.readdir(this.defaultsPath);
      return names.map(name => name.replace('.json', ''));
    } catch (error) {
      this.logger.error(`Failed to get default color names:`, error);
      throw error;
    }
  }

  /**
   * Get colors for a specific OS, merging defaults with custom colors
   */
  async getColors(name: string): Promise<ColorData> {
    try {

      const custom = await this.loadCustom(name);
      if (custom) {
        return custom;
      }
      // no custom, load defaults:
      return await this.loadDefaults(name);

    } catch (error) {
      this.logger.error(`Failed to get colors for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Save custom colors for a specific OS
   */
  async saveColors(name: string, colors: ColorData): Promise<void> {
    try {
      const customFilePath = join(this.customPath, `${name}.json`);

      // Create custom file from defaults if it doesn't exist
      const defaultFilePath = join(this.defaultsPath, `${name}.json`);
      try {
        const exists = existsSync(customFilePath);
        if (!exists) {
          this.logger.warn(`Create custom file from defaults for ${name}...`);
          await fs.copyFile(defaultFilePath, customFilePath);
        }
      } catch {
        this.logger.error(`Failed to copy file: `, defaultFilePath, customFilePath);
      }

      await fs.writeFile(customFilePath, JSON.stringify(colors, null, 2));
      this.logger.log(`Saved custom colors for ${name}`);
    } catch (error) {
      this.logger.error(`Failed to save colors for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Reset colors to defaults by removing custom colors
   */
  async resetToDefaults(name: string): Promise<ColorData> {
    try {
      const customFilePath = join(this.customPath, `${name}.json`);

      // Remove custom file if it exists
      try {
        await fs.unlink(customFilePath);
        this.logger.log(`Removed custom colors for ${name}`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return await this.loadDefaults(name);
    } catch (error) {
      this.logger.error(`Failed to reset colors for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get default colors for a specific OS
   */
  async getDefaults(name: string): Promise<ColorData | null> {
    return await this.loadDefaults(name);
  }

  private async loadDefaults(name: string): Promise<ColorData | null> {
    try {
      const defaultFilePath = join(this.defaultsPath, `${name}.json`);
      const content = await fs.readFile(defaultFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to load default colors for ${name}:`, error);
      return null;
    }
  }

  private async loadCustom(name: string): Promise<ColorData | null> {
    try {
      const customFilePath = join(this.customPath, `${name}.json`);
      const content = await fs.readFile(customFilePath, 'utf-8');
      return JSON.parse(content);

    } catch (error) {
      // Custom file might not exist, which is fine
      if (error.code === 'ENOENT') {
        return null;
      }
      this.logger.error(`Failed to load custom colors for ${name}:`, error);
      return null;
    }
  }
}