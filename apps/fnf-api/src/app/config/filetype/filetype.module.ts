import {Module} from '@nestjs/common';
import {FiletypeController} from './filetype.controller';
import {FiletypeService} from './filetype.service';

@Module({
  controllers: [FiletypeController],
  providers: [FiletypeService],
  exports: [FiletypeService],
})
export class FiletypeModule {
}