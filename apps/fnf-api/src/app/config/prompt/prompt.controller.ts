import {Body, Controller, Get, Logger, Param, Post, Put} from '@nestjs/common';
import {PromptService} from './prompt.service';
import {PromptDataIf} from "@fnf-data";

@Controller('prompts')
export class PromptController {

  private readonly logger = new Logger(PromptController.name);

  constructor(
    private readonly promptService: PromptService
  ) {
  }


  @Get('customnames')
  async getCustomNames(): Promise<string[]> {
    this.logger.log(`Getting getCustomNames`);
    return await this.promptService.getCustomNames();
  }

  @Get('getdefaultnames')
  async getDefaultNames(): Promise<string[]> {
    this.logger.log(`Getting getDefaultNames`);
    return await this.promptService.getDefaultNames();
  }

  @Get(':key')
  async getPrompt(@Param('key') key: string): Promise<PromptDataIf> {
    this.logger.log(`Getting prompt for ${key}`);
    return await this.promptService.getPrompt(key);
  }


  @Get(':key/defaults')
  async getDefaults(@Param('key') key: string): Promise<PromptDataIf> {
    this.logger.log(`Getting default prompt for ${key}`);
    return await this.promptService.getDefaults(key);
  }


  @Put(':key')
  async savePrompt(
    @Param('key') key: string,
    @Body() prompt: PromptDataIf
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving prompt for ${key}`);
    try {
      await this.promptService.savePrompt(key, prompt);
      return {success: true, message: `Prompt saved for ${key}`};
    } catch (error) {
      this.logger.error(`Failed to save prompt for ${key}:`, error);
      return {success: false, message: `Failed to save prompt: ${error.message}`};
    }
  }


  @Post(':key/reset')
  async resetToDefaults(@Param('key') key: string): Promise<PromptDataIf> {
    this.logger.log(`Resetting prompt to defaults for ${key}`);
    return await this.promptService.resetToDefaults(key);
  }
}