import {Body, Controller, Get, Logger, Param, Post, Put} from '@nestjs/common';
import {ColorService} from './color.service';
import {ColorData} from "@fnf-data";

@Controller('colors')
export class ColorController {

  private readonly logger = new Logger(ColorController.name);

  constructor(
    private readonly colorService: ColorService
  ) {
  }


  @Get(':name')
  async getColors(@Param('name') name: string): Promise<ColorData> {
    this.logger.log(`Getting colors for ${name}`);
    return await this.colorService.getColors(name);
  }


  @Get(':name/defaults')
  async getDefaults(@Param('name') name: string): Promise<ColorData> {
    this.logger.log(`Getting default colors for ${name}`);
    return await this.colorService.getDefaults(name);
  }


  @Put(':name')
  async saveColors(
    @Param('name') name: string,
    @Body() colors: ColorData
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving colors for ${name}`);
    try {
      await this.colorService.saveColors(name, colors);
      return {success: true, message: `Colors saved for ${name}`};
    } catch (error) {
      this.logger.error(`Failed to save colors for ${name}:`, error);
      return {success: false, message: `Failed to save colors: ${error.message}`};
    }
  }


  @Post(':name/reset')
  async resetToDefaults(@Param('name') name: string): Promise<ColorData> {
    this.logger.log(`Resetting colors to defaults for ${name}`);
    return await this.colorService.resetToDefaults(name);
  }
}