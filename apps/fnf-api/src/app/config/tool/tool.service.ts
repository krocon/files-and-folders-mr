import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {environment} from "../../../environments/environment";
import {BrowserOsType, ToolData} from "@fnf-data";


@Injectable()
export class ToolService {

  private readonly logger = new Logger(ToolService.name);
  private readonly defaultsPath = environment.toolDefaultsPath;
  private readonly customPath = environment.toolCustomPath;


  async getTools(os: BrowserOsType): Promise<ToolData> {
    try {

      const custom = await this.loadCustom(os);
      if (custom) {
        return custom;
      }
      // no custom, load defaults:
      return await this.loadDefaults(os);

    } catch (error) {
      this.logger.error(`Failed to get tools for ${os}:`, error);
      throw error;
    }
  }


  async saveTools(os: BrowserOsType, tools: ToolData): Promise<void> {
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

      await fs.writeFile(customFilePath, JSON.stringify(tools, null, 2));
      this.logger.log(`Saved custom tools for ${os}`);
    } catch (error) {
      this.logger.error(`Failed to save tools for ${os}:`, error);
      throw error;
    }
  }


  async resetToDefaults(os: BrowserOsType): Promise<ToolData> {
    try {
      const customFilePath = join(this.customPath, `${os}.json`);

      // Remove custom file if it exists
      try {
        await fs.unlink(customFilePath);
        this.logger.log(`Removed custom tools for ${os}`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return await this.loadDefaults(os);
    } catch (error) {
      this.logger.error(`Failed to reset tools for ${os}:`, error);
      throw error;
    }
  }


  async getDefaults(os: BrowserOsType): Promise<ToolData> {
    return await this.loadDefaults(os);
  }

  private async loadDefaults(os: BrowserOsType): Promise<ToolData> {
    try {
      const defaultFilePath = join(this.defaultsPath, `${os}.json`);
      const content = await fs.readFile(defaultFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to load default tools for ${os}:`, error);
      return [];
    }
  }

  private async loadCustom(os: BrowserOsType): Promise<ToolData | null> {
    try {
      const customFilePath = join(this.customPath, `${os}.json`);
      const content = await fs.readFile(customFilePath, 'utf-8');
      return JSON.parse(content);

    } catch (error) {
      // Custom file might not exist, which is fine
      if (error.code === 'ENOENT') {
        return null;
      }
      this.logger.error(`Failed to load custom tools for ${os}:`, error);
      return null;
    }
  }
}