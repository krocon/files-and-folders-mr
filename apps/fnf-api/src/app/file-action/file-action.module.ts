import {Module} from "@nestjs/common";
import {FileService} from "./file.service";
import {FileActionController} from "./file-action.controller";
import {FileActionGateway} from "./file-action.gateway";

@Module({
  imports: [],
  controllers: [
    FileActionController
  ],
  providers: [
    FileService,
    FileActionGateway
  ],
  exports: [
    FileActionGateway
  ]
})
export class FileActionModule {
}
