import {Controller, Get, Put, Post, Param, Body, Logger} from '@nestjs/common';
import {ToolService} from './tool.service';
import {BrowserOsType, ToolData} from "@fnf-data";

@Controller('tools')
export class ToolController {

  private readonly logger = new Logger(ToolController.name);

  constructor(private readonly toolService: ToolService) {
  }


  @Get(':os')
  async getTools(@Param('os') os: BrowserOsType): Promise<ToolData> {
    this.logger.log(`Getting tools for ${os}`);
    return await this.toolService.getTools(os);
  }


  @Get(':os/defaults')
  async getDefaults(@Param('os') os: BrowserOsType): Promise<ToolData> {
    this.logger.log(`Getting default tools for ${os}`);
    return await this.toolService.getDefaults(os);
  }


  @Put(':os')
  async saveTools(
    @Param('os') os: BrowserOsType,
    @Body() tools: ToolData
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving tools for ${os}`);
    try {
      await this.toolService.saveTools(os, tools);
      return {success: true, message: `Tools saved for ${os}`};
    } catch (error) {
      this.logger.error(`Failed to save tools for ${os}:`, error);
      return {success: false, message: `Failed to save tools: ${error.message}`};
    }
  }


  @Post(':os/reset')
  async resetToDefaults(@Param('os') os: BrowserOsType): Promise<ToolData> {
    this.logger.log(`Resetting tools to defaults for ${os}`);
    return await this.toolService.resetToDefaults(os);
  }
}