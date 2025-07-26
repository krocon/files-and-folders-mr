import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {environment} from "../../../environments/environment";
import {FiletypeExtensionMapping} from "@fnf-data";


@Injectable()
export class SearchPatternService {

  private readonly logger = new Logger(SearchPatternService.name);
  private readonly defaultsPath = environment.searchPatternDefaultsPath;
  private readonly customPath = environment.searchPatternCustomPath;


  async load(): Promise<FiletypeExtensionMapping> {
    try {

      const custom = await this.loadCustom();
      if (custom) {
        return custom.sort();
      }
      // no custom, load defaults:
      return await this.loadDefaults();

    } catch (error) {
      this.logger.error(`Failed to get filetype for seach-patterns:`, error);
      throw error;
    }
  }


  async save(filetype: FiletypeExtensionMapping): Promise<void> {
    try {
      const customFilePath = join(this.customPath, `data.json`);

      // Create custom file from defaults if it doesn't exist
      const defaultFilePath = join(this.defaultsPath, `data.json`);
      try {
        const exists = existsSync(customFilePath);
        if (!exists) {
          this.logger.warn(`Create custom file from defaults for seach-patterns...`);
          await fs.copyFile(defaultFilePath, customFilePath);
        }
      } catch {
        this.logger.error(`Failed to copy file: `, defaultFilePath, customFilePath);
      }

      await fs.writeFile(customFilePath, JSON.stringify(filetype, null, 2));
      this.logger.log(`Saved custom filetype for seach-patterns`);
    } catch (error) {
      this.logger.error(`Failed to save filetype for seach-patterns:`, error);
      throw error;
    }
  }


  async resetToDefaults(): Promise<FiletypeExtensionMapping> {
    try {
      const customFilePath = join(this.customPath, `data.json`);

      // Remove custom file if it exists
      try {
        await fs.unlink(customFilePath);
        this.logger.log(`Removed custom filetype for seach-patterns`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return await this.loadDefaults();
    } catch (error) {
      this.logger.error(`Failed to reset filetype for seach-patterns:`, error);
      throw error;
    }
  }


  async loadDefaults(): Promise<FiletypeExtensionMapping> {
    try {
      const defaultFilePath = join(this.defaultsPath, `data.json`);
      const content = await fs.readFile(defaultFilePath, 'utf-8');
      return JSON.parse(content).sort() as FiletypeExtensionMapping;
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