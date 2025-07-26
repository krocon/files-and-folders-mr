import {DynamicModule, Logger, Module} from "@nestjs/common";
import {PathService} from "./path.service";
import {PathController} from "./path.controller";
import {Config} from "@fnf-data";


@Module({
  controllers: [PathController]
})
export class PathModule {

  public static forRoot(config: Config): DynamicModule {
    if (config) {
      PathService.config = config;
      Logger.log("ConfigModule config -> " + JSON.stringify(config, null, 2));
    }
    return {
      module: PathModule,
      providers: [
        PathService
      ]
    };
  }

}
