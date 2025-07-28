import {FileItemIf} from "../dir/file-item.if";

export class PackParaData {

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