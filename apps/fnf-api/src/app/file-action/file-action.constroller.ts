import {Controller, Logger, Post, Body, Res, ArgumentsHost} from "@nestjs/common";
import {FileService} from "./file.service";
import {MessageBody} from "@nestjs/websockets";
import {DirEventIf, DirPara, FilePara, OnDoResponseType, DownloadDialogResultData, FileItemIf} from "@fnf-data";
import {download} from "./action/download.fn";
import * as path from "path";
import * as fs from "fs";


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

  @Post("download")
  async download(@Body() data: DownloadDialogResultData, @Res() res: any) {
    try {
      // Convert DownloadDialogResultData to FilePara format
      const sourceItems = data.source.map(filePath => {
        const parts = filePath.split('/');
        const base = parts.pop() || '';
        const dir = parts.join('/') || '/';
        const fullPath = path.join(dir, base);
        
        let stats;
        try {
          stats = fs.statSync(fullPath);
        } catch (e) {
          stats = { size: 0, isDirectory: () => false };
        }
        
        return {
          dir: dir,
          base: base,
          ext: base.includes('.') ? '.' + base.split('.').pop() || '' : '',
          size: stats.size || 0,
          date: new Date().toISOString(),
          isDir: stats.isDirectory(),
          abs: true,
          meta: undefined
        } as FileItemIf;
      });

      const filePara = {
        cmd: 'download' as const,
        source: sourceItems,
        target: {
          dir: data.targetDirectory,
          base: data.targetFilename,
          ext: data.targetFilename.split('.').pop() || ''
        },
        password: data.password,
        format: data.format,
        compressionLevel: data.compressionLevel
      };

      await download(filePara, res);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({error: error.message});
    }
  }

  // @Post("walkdir")
  // walkdir(@MessageBody() walkParaData: WalkParaData): WalkData {
  //
  //   console.info("walkdir() walkParaData:", walkParaData);
  //   const walkData = new WalkData();
  //   const buf = [...walkParaData.files];
  //
  //   while (buf.length) {
  //     const ff = buf.pop();
  //     const stats = fs.statSync(ff);
  //     console.info(ff, stats); // TODO del
  //     if (stats.isDirectory()) {
  //       walkData.folderCount++;
  //       const ffs = fs.readdirSync(ff);
  //       ffs.forEach(f => buf.push(path.join(ff, f)));
  //
  //     } else if (stats.isFile()) {
  //       walkData.fileCount++;
  //       walkData.sizeSum = walkData.sizeSum + stats.size;
  //       console.info('walkData.sizeSum:'+walkData.sizeSum +', stats:'+ stats.size); // TODO del
  //     }
  //   }
  //   return walkData;
  // }

}
