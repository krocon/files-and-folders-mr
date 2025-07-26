import {Module} from '@nestjs/common';
import {ShortcutController} from './shortcut.controller';
import {ShortcutService} from './shortcut.service';

@Module({
  controllers: [ShortcutController],
  providers: [ShortcutService],
  exports: [ShortcutService],
})
export class ShortcutModule {
}