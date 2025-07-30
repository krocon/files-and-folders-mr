import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {environment} from "../../../environments/environment";
import {FiletypeExtensionMapping} from "@fnf-data";


@Injectable()
export class FiletypeService {

  private readonly logger = new Logger(FiletypeService.name);
  private readonly defaultsPath = environment.filetypeDefaultsPath;
  private readonly customPath = environment.filetypeCustomPath;


  async getData(): Promise<FiletypeExtensionMapping> {
    try {

      const custom = await this.loadCustom();
      if (custom) {
        return custom;
      }
      // no custom, load defaults:
      return await this.loadDefaults();

    } catch (error) {
      this.logger.error(`Failed to get filetype for data:`, error);
      throw error;
    }
  }


  async saveFiletype(filetype: FiletypeExtensionMapping): Promise<void> {
    try {
      const customFilePath = join(this.customPath, `data.json`);

      // Create custom file from defaults if it doesn't exist
      const defaultFilePath = join(this.defaultsPath, `data.json`);
      try {
        const exists = existsSync(customFilePath);
        if (!exists) {
          this.logger.warn(`Create custom file from defaults for data...`);
          await fs.copyFile(defaultFilePath, customFilePath);
        }
      } catch {
        this.logger.error(`Failed to copy file: `, defaultFilePath, customFilePath);
      }

      await fs.writeFile(customFilePath, JSON.stringify(filetype, null, 2));
      this.logger.log(`Saved custom filetype for data`);
    } catch (error) {
      this.logger.error(`Failed to save filetype for data:`, error);
      throw error;
    }
  }


  async resetToDefaults(): Promise<FiletypeExtensionMapping> {
    try {
      const customFilePath = join(this.customPath, `data.json`);

      // Remove custom file if it exists
      try {
        await fs.unlink(customFilePath);
        this.logger.log(`Removed custom filetype for data`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return await this.loadDefaults();
    } catch (error) {
      this.logger.error(`Failed to reset filetype for data:`, error);
      throw error;
    }
  }


  async getDefaults(): Promise<FiletypeExtensionMapping> {
    return await this.loadDefaults();
  }

  private async loadDefaults(): Promise<FiletypeExtensionMapping> {
    try {
      const defaultFilePath = join(this.defaultsPath, `data.json`);
      const content = await fs.readFile(defaultFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to load default filetype:`, error);
      return [];
    }
  }

  private async loadCustom(): Promise<FiletypeExtensionMapping | null> {
    try {
      const customFilePath = join(this.customPath, `data.json`);
      const content = await fs.readFile(customFilePath, 'utf-8');
      return JSON.parse(content);

    } catch (error) {
      // Custom file might not exist, which is fine
      if (error.code === 'ENOENT') {
        return null;
      }
      this.logger.error(`Failed to load custom filetype:`, error);
      return null;
    }
  }
}