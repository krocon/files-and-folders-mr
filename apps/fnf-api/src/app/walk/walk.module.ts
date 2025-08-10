import {Module} from "@nestjs/common";
import {WalkGateway} from "./walk.gateway";
import {DirController} from "./walk.controller";
import {AppLoggerService} from "../shared/logger.service";


@Module({
  imports: [],
  controllers: [
    DirController
  ],
  providers: [
    WalkGateway,
    AppLoggerService
  ],
  exports: [
    WalkGateway
  ]
})
export class WalkModule {
}
