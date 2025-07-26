import {Module} from '@nestjs/common';
import {SearchPatternController} from './search-pattern.controller';
import {SearchPatternService} from './search-pattern.service';

@Module({
  controllers: [SearchPatternController],
  providers: [SearchPatternService],
  exports: [SearchPatternService],
})
export class SearchPatternModule {
}