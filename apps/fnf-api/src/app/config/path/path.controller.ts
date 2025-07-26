import {Controller, Get} from "@nestjs/common";
import {PathService} from "./path.service";
import {Config} from "@fnf-data";

@Controller()
export class PathController {
  constructor(private readonly configService: PathService) {
  }

  @Get("config")
  getConfig(): Config {
    return this.configService.getData();
  }
}
