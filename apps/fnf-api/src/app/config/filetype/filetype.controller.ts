import {Body, Controller, Get, Logger, Post, Put} from '@nestjs/common';
import {FiletypeService} from './filetype.service';
import {FiletypeExtensionMapping} from "@fnf-data";

@Controller('filetypes')
export class FiletypeController {

  private readonly logger = new Logger(FiletypeController.name);

  constructor(private readonly filetypeService: FiletypeService) {
  }


  @Get()
  async getData(): Promise<FiletypeExtensionMapping> {
    this.logger.log(`Getting filetypes`);
    return await this.filetypeService.getData();
  }


  @Get('defaults')
  async getDefaults(): Promise<FiletypeExtensionMapping> {
    this.logger.log(`Getting default filetypes`);
    return await this.filetypeService.getDefaults();
  }


  @Put()
  async saveFiletypes(
    @Body() filetypes: FiletypeExtensionMapping
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving filetypes`);
    try {
      await this.filetypeService.saveFiletype(filetypes);
      return {success: true, message: `Filetypes saved`};
    } catch (error) {
      this.logger.error(`Failed to save filetypes:`, error);
      return {success: false, message: `Failed to save filetypes: ${error.message}`};
    }
  }


  @Post(':reset')
  async resetToDefaults(): Promise<FiletypeExtensionMapping> {
    this.logger.log(`Resetting filetypes to defaults`);
    return await this.filetypeService.resetToDefaults();
  }
}