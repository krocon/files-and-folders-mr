import {Controller, Post} from "@nestjs/common";
import {MessageBody} from "@nestjs/websockets";
import {
  DirEvent,
  DirPara,
  SetFileAttributesData,
  FileItemIf
} from "@fnf-data";
import {DirService} from "./dir-service";
import {FileAttributeService} from "./file-attribute.service";


@Controller()
export class DirController {

  constructor(
    private readonly dirService: DirService,
    private readonly fileAttributeService: FileAttributeService
  ) {
  }

  @Post("readdir")
  readdir(@MessageBody() para: DirPara): Promise<DirEvent[]> {
    return this.dirService.readdir(para);
  }

  @Post("getfileattributes")
  getFileAttributes(@MessageBody() para: FileItemIf): Promise<FileItemIf> {
    return this.fileAttributeService.apiUrlAttribute(para);
  }

  @Post("setfileattributes")
  setFileAttributes(@MessageBody() para: SetFileAttributesData): Promise<void> {
    return this.fileAttributeService.setFileAttributes(para);
  }

}
