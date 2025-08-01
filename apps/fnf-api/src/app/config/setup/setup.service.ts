import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {environment} from "../../../environments/environment";
import {SetupData} from "@fnf-data";

@Injectable()
export class SetupService {

  private readonly logger = new Logger(SetupService.name);
  private readonly setupPath = environment.setupPath;

  async getData(): Promise<SetupData> {
    try {
      const setupFilePath = join(this.setupPath, 'data.json');

      if (existsSync(setupFilePath)) {
        const content = await fs.readFile(setupFilePath, 'utf-8');
        const jsonData = JSON.parse(content);
        return SetupData.fromJSON(jsonData);
      }

      // Return defaults if file doesn't exist
      return SetupData.getDefaults();

    } catch (error) {
      this.logger.error(`Failed to get setup data:`, error);
      // Return defaults on error
      return SetupData.getDefaults();
    }
  }

  async saveData(setupData: SetupData): Promise<void> {
    try {
      const setupFilePath = join(this.setupPath, 'data.json');

      // Ensure directory exists
      await fs.mkdir(this.setupPath, {recursive: true});

      await fs.writeFile(setupFilePath, JSON.stringify(setupData.toJSON(), null, 2));
      this.logger.log(`Saved setup data`);
    } catch (error) {
      this.logger.error(`Failed to save setup data:`, error);
      throw error;
    }
  }

  async resetToDefaults(): Promise<SetupData> {
    try {
      const setupFilePath = join(this.setupPath, 'data.json');

      // Remove custom file if it exists
      try {
        await fs.unlink(setupFilePath);
        this.logger.log(`Removed custom setup data`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return SetupData.getDefaults();
    } catch (error) {
      this.logger.error(`Failed to reset setup data:`, error);
      throw error;
    }
  }

  async getDefaults(): Promise<SetupData> {
    return SetupData.getDefaults();
  }
}