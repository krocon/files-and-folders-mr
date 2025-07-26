import {Body, Controller, Get, Logger, Post, Put} from '@nestjs/common';
import {SearchPatternService} from './search-pattern.service';
import {FiletypeExtensionMapping} from "@fnf-data";

@Controller('searchpatterns')
export class SearchPatternController {

  private readonly logger = new Logger(SearchPatternController.name);

  constructor(private readonly searchService: SearchPatternService) {
  }


  @Get()
  async load(): Promise<FiletypeExtensionMapping> {
    this.logger.log(`Getting Search Patterns`);
    return await this.searchService.load();
  }


  @Get('defaults')
  async getDefaults(): Promise<FiletypeExtensionMapping> {
    this.logger.log(`Getting default Search Patterns`);
    return await this.searchService.loadDefaults();
  }


  @Put()
  async save(
    @Body() filetypes: FiletypeExtensionMapping
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving Search Patterns`);
    try {
      await this.searchService.save(filetypes);
      return {success: true, message: `Search Patterns saved`};
    } catch (error) {
      this.logger.error(`Failed to save filetypes:`, error);
      return {success: false, message: `Failed to save Search Patterns: ${error.message}`};
    }
  }


  @Post(':reset')
  async resetToDefaults(): Promise<FiletypeExtensionMapping> {
    this.logger.log(`Resetting Search Patterns to defaults`);
    return await this.searchService.resetToDefaults();
  }
}