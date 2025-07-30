import {Body, Controller, Get, Logger, Post, Put} from '@nestjs/common';
import {ButtonService, ButtonMapping} from './button.service';

@Controller('buttons')
export class ButtonController {

  private readonly logger = new Logger(ButtonController.name);

  constructor(private readonly buttonService: ButtonService) {
  }


  @Get()
  async getData(): Promise<ButtonMapping> {
    this.logger.log(`Getting buttons`);
    return await this.buttonService.getData();
  }


  @Get('defaults')
  async getDefaults(): Promise<ButtonMapping> {
    this.logger.log(`Getting default buttons`);
    return await this.buttonService.getDefaults();
  }


  @Put()
  async saveButtons(
    @Body() buttons: ButtonMapping
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Saving buttons`);
    try {
      await this.buttonService.saveButtons(buttons);
      return {success: true, message: `Buttons saved`};
    } catch (error) {
      this.logger.error(`Failed to save buttons:`, error);
      return {success: false, message: `Failed to save buttons: ${error.message}`};
    }
  }


  @Post(':reset')
  async resetToDefaults(): Promise<ButtonMapping> {
    this.logger.log(`Resetting buttons to defaults`);
    return await this.buttonService.resetToDefaults();
  }
}