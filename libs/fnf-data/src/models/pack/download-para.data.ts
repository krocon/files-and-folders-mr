import {FileItemIf} from "../dir/file-item.if";

export class DownloadParaData {

  constructor(
    public source: FileItemIf[],
    public targetFilename: string,
    public targetDirectory: string,
    public password: string,
    public format: string,
    public compressionLevel: number
  ) {
  }
} 