import {Controller, Get} from "@nestjs/common";
import {AppService} from "./app.service";

@Controller()
export class AppController {

  @Get("/")
  getApiInfos(): string[] {
    return AppService.availableRoutes;
  }

  @Get('apiPort')
  getConfig() {
    return {
      apiPort: process.env.FNF_API_PORT || 3333
    };
  }

}
