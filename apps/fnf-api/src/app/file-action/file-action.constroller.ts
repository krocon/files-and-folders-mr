import {Controller, Logger, Post} from "@nestjs/common";
import {FileService} from "./file.service";
import {MessageBody} from "@nestjs/websockets";
import {DirEventIf, DirPara, FilePara, OnDoResponseType} from "@fnf-data";


@Controller("do")
export class FileActionController {

  private readonly logger = new Logger(FileActionController.name);

  constructor(
    private readonly fileService: FileService
  ) {
  }

  @Post("")
  async onDo(@MessageBody() para: FilePara): Promise<OnDoResponseType> {
    console.info("cmd:", para.cmd);
    let fn = this.fileService.getFunctionByCmd(para.cmd);
    return fn(para);
  }


  @Post("unpacklist")
  async unpacklist(@MessageBody() para: DirPara): Promise<DirEventIf> {
    return this.fileService.unpacklist(para.path);
  }


}
