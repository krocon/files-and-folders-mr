import {Body, Controller, Get, Logger, Post, Put} from '@nestjs/common';
import {SetupService} from './setup.service';
import {SetupData} from '@fnf-data';

@Controller('setup')
export class SetupController {

  private readonly logger = new Logger(SetupController.name);

  constructor(private readonly setupService: SetupService) {
  }

  @Get()
  async getData(): Promise<SetupData> {
    this.logger.log(`Getting setup data`);
    return await this.setupService.getData();
  }

  @Get('defaults')
  async getDefaults(): Promise<SetupData> {
    this.logger.log(`Getting default setup data`);
    return await this.setupService.getDefaults();
  }

  @Put()
  async saveData(
    @Body() setupData: SetupData
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving setup data`);
    try {
      // Convert plain object to SetupData instance if needed
      const setupDataInstance = setupData instanceof SetupData
        ? setupData
        : SetupData.fromJSON(setupData);

      await this.setupService.saveData(setupDataInstance);
      return {success: true, message: `Setup data saved`};
    } catch (error) {
      this.logger.error(`Failed to save setup data:`, error);
      return {success: false, message: `Failed to save setup data: ${error.message}`};
    }
  }

  @Post('reset')
  async resetToDefaults(): Promise<SetupData> {
    this.logger.log(`Resetting setup data to defaults`);
    return await this.setupService.resetToDefaults();
  }
}