import {Module} from "@nestjs/common";
import {DirGateway} from "./dir.gateway";
import {DirService} from "./dir-service";
import {DirController} from "./dir.controller";
import {FileAttributeService} from "./file-attribute.service";
import {Config} from "@fnf-data";


@Module({
  imports: [],
  controllers: [
    DirController
  ],
  exports: [
    DirGateway
  ],
  // providers: [
  //   DirGateway,
  //   DirService
  // ]
})
export class DirModule {


  static forRoot(config: Config) {
    DirService.config = config;
    return {
      module: DirModule,
      providers: [
        DirGateway,
        DirService,
        FileAttributeService
      ]
    };
  }
}
