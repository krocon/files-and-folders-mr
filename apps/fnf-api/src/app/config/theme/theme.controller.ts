import {Body, Controller, Get, Logger, Param, Post, Put} from '@nestjs/common';
import {ThemeService} from './theme.service';
import {ColorDataIf} from "@fnf-data";

@Controller('themes')
export class ThemeController {

  private readonly logger = new Logger(ThemeController.name);

  constructor(
    private readonly colorService: ThemeService
  ) {
  }


  @Get('customnames')
  async getCustomNames(): Promise<string[]> {
    this.logger.log(`Getting getCustomNames`);
    return await this.colorService.getCustomNames();
  }

  @Get('getdefaultnames')
  async getDefaultNames(): Promise<string[]> {
    this.logger.log(`Getting getDefaultNames`);
    return await this.colorService.getDefaultNames();
  }

  @Get(':name')
  async getColors(@Param('name') name: string): Promise<ColorDataIf> {
    this.logger.log(`Getting colors for ${name}`);
    return await this.colorService.getColors(name);
  }


  @Get(':name/defaults')
  async getDefaults(@Param('name') name: string): Promise<ColorDataIf> {
    this.logger.log(`Getting default colors for ${name}`);
    return await this.colorService.getDefaults(name);
  }


  @Put(':name')
  async saveColors(
    @Param('name') name: string,
    @Body() colors: ColorDataIf
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
  async resetToDefaults(@Param('name') name: string): Promise<ColorDataIf> {
    this.logger.log(`Resetting colors to defaults for ${name}`);
    return await this.colorService.resetToDefaults(name);
  }
}