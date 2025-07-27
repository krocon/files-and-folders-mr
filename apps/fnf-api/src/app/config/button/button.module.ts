import {Module} from '@nestjs/common';
import {ButtonController} from './button.controller';
import {ButtonService} from './button.service';

@Module({
  controllers: [ButtonController],
  providers: [ButtonService],
  exports: [ButtonService],
})
export class ButtonModule {
}