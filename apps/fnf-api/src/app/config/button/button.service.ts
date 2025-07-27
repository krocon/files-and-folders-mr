import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {environment} from "../../../environments/environment";
import {ButtonEnableStatesKey} from "@fnf-data";

export type ButtonMapping = { [key: string]: ButtonEnableStatesKey[] };

@Injectable()
export class ButtonService {

  private readonly logger = new Logger(ButtonService.name);
  private readonly defaultsPath = environment.buttonDefaultsPath;
  private readonly customPath = environment.buttonCustomPath;


  async apiUrlButtons(): Promise<ButtonMapping> {
    try {

      const custom = await this.loadCustom();
      if (custom) {
        return custom;
      }
      // no custom, load defaults:
      return await this.loadDefaults();

    } catch (error) {
      this.logger.error(`Failed to get buttons for data:`, error);
      throw error;
    }
  }


  async saveButtons(buttons: ButtonMapping): Promise<void> {
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

      await fs.writeFile(customFilePath, JSON.stringify(buttons, null, 2));
      this.logger.log(`Saved custom buttons for data`);
    } catch (error) {
      this.logger.error(`Failed to save buttons for data:`, error);
      throw error;
    }
  }


  async resetToDefaults(): Promise<ButtonMapping> {
    try {
      const customFilePath = join(this.customPath, `data.json`);

      // Remove custom file if it exists
      try {
        await fs.unlink(customFilePath);
        this.logger.log(`Removed custom buttons for data`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return await this.loadDefaults();
    } catch (error) {
      this.logger.error(`Failed to reset buttons for data:`, error);
      throw error;
    }
  }


  async getDefaults(): Promise<ButtonMapping> {
    return await this.loadDefaults();
  }

  private async loadDefaults(): Promise<ButtonMapping> {
    try {
      const defaultFilePath = join(this.defaultsPath, `data.json`);
      const content = await fs.readFile(defaultFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to load default buttons:`, error);
      return {};
    }
  }

  private async loadCustom(): Promise<ButtonMapping | null> {
    try {
      const customFilePath = join(this.customPath, `data.json`);
      const content = await fs.readFile(customFilePath, 'utf-8');
      return JSON.parse(content);

    } catch (error) {
      // Custom file might not exist, which is fine
      if (error.code === 'ENOENT') {
        return null;
      }
      this.logger.error(`Failed to load custom buttons:`, error);
      return null;
    }
  }
}