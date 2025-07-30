import {Controller, Get, Put, Post, Param, Body, Logger} from '@nestjs/common';
import {ShortcutService} from './shortcut.service';
import {BrowserOsType, ShortcutActionMapping} from "@fnf-data";

@Controller('shortcuts')
export class ShortcutController {
  private readonly logger = new Logger(ShortcutController.name);

  constructor(private readonly shortcutService: ShortcutService) {
  }

  /**
   * Get shortcuts for a specific OS (merged defaults + custom)
   */
  @Get(':os')
  async getData(@Param('os') os: BrowserOsType): Promise<ShortcutActionMapping> {
    this.logger.log(`Getting shortcuts for ${os}`);
    return await this.shortcutService.getData(os);
  }

  /**
   * Get default shortcuts for a specific OS
   */
  @Get(':os/defaults')
  async getDefaults(@Param('os') os: BrowserOsType): Promise<ShortcutActionMapping> {
    this.logger.log(`Getting default shortcuts for ${os}`);
    return await this.shortcutService.getDefaults(os);
  }

  /**
   * Save custom shortcuts for a specific OS
   */
  @Put(':os')
  async saveShortcuts(
    @Param('os') os: BrowserOsType,
    @Body() shortcuts: ShortcutActionMapping
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving shortcuts for ${os}`);
    try {
      await this.shortcutService.saveShortcuts(os, shortcuts);
      return {success: true, message: `Shortcuts saved for ${os}`};
    } catch (error) {
      this.logger.error(`Failed to save shortcuts for ${os}:`, error);
      return {success: false, message: `Failed to save shortcuts: ${error.message}`};
    }
  }

  /**
   * Reset shortcuts to defaults for a specific OS
   */
  @Post(':os/reset')
  async resetToDefaults(@Param('os') os: BrowserOsType): Promise<ShortcutActionMapping> {
    this.logger.log(`Resetting shortcuts to defaults for ${os}`);
    return await this.shortcutService.resetToDefaults(os);
  }
}