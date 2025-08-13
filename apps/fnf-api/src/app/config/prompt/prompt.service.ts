import {Injectable, Logger} from '@nestjs/common';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import * as yaml from 'js-yaml';
import {environment} from "../../../environments/environment";
import {PromptDataIf} from "@fnf-data";


@Injectable()
export class PromptService {

  private readonly logger = new Logger(PromptService.name);
  private readonly defaultsPath = environment.promptDefaultsPath;
  private readonly customPath = environment.promptCustomPath;


  async getCustomNames(): Promise<string[]> {
    try {
      const names: string[] = await fs.readdir(this.customPath);
      return names.filter(n => n.endsWith('.yaml')).map(name => name.replace('.yaml', '')).sort();
    } catch (error) {
      this.logger.error(`Failed to get custom prompt names:`, error);
      throw error;
    }
  }

  async getDefaultNames(): Promise<string[]> {
    try {
      const names: string[] = await fs.readdir(this.defaultsPath);
      return names.map(name => name.replace('.yaml', '')).sort();
    } catch (error) {
      this.logger.error(`Failed to get default prompt names:`, error);
      throw error;
    }
  }

  /**
   * Get prompt for a specific key, merging defaults with custom prompts
   */
  async getPrompt(key: string): Promise<PromptDataIf> {
    try {

      const custom = await this.loadCustom(key);
      if (custom) {
        return custom;
      }
      // no custom, load defaults:
      return await this.loadDefaults(key);

    } catch (error) {
      this.logger.error(`Failed to get prompt for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Save custom prompt for a specific key
   */
  async savePrompt(key: string, prompt: PromptDataIf): Promise<void> {
    try {
      const customFilePath = join(this.customPath, `${key}.yaml`);

      // Create custom file from defaults if it doesn't exist
      const defaultFilePath = join(this.defaultsPath, `${key}.yaml`);
      try {
        const exists = existsSync(customFilePath);
        if (!exists) {
          this.logger.warn(`Create custom file from defaults for ${key}...`);
          await fs.copyFile(defaultFilePath, customFilePath);
        }
      } catch {
        this.logger.error(`Failed to copy file: `, defaultFilePath, customFilePath);
      }

      await fs.writeFile(customFilePath, yaml.dump(prompt));
      this.logger.log(`Saved custom prompt for ${key}`);
    } catch (error) {
      this.logger.error(`Failed to save prompt for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Reset prompt to defaults by removing custom prompt
   */
  async resetToDefaults(key: string): Promise<PromptDataIf> {
    try {
      const customFilePath = join(this.customPath, `${key}.yaml`);

      // Remove custom file if it exists
      try {
        await fs.unlink(customFilePath);
        this.logger.log(`Removed custom prompt for ${key}`);
      } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Return defaults
      return await this.loadDefaults(key);
    } catch (error) {
      this.logger.error(`Failed to reset prompt for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get default prompt for a specific key
   */
  async getDefaults(key: string): Promise<PromptDataIf | null> {
    return await this.loadDefaults(key);
  }

  private async loadDefaults(key: string): Promise<PromptDataIf | null> {
    try {
      const defaultFilePath = join(this.defaultsPath, `${key}.yaml`);
      const content = await fs.readFile(defaultFilePath, 'utf-8');
      return yaml.load(content) as PromptDataIf;
    } catch (error) {
      this.logger.error(`Failed to load default prompt for ${key}:`, error);
      return null;
    }
  }

  private async loadCustom(key: string): Promise<PromptDataIf | null> {
    try {
      const customFilePath = join(this.customPath, `${key}.yaml`);
      const content = await fs.readFile(customFilePath, 'utf-8');
      return yaml.load(content) as PromptDataIf;

    } catch (error) {
      // Custom file might not exist, which is fine
      if (error.code === 'ENOENT') {
        return null;
      }
      this.logger.error(`Failed to load custom prompt for ${key}:`, error);
      return null;
    }
  }
}