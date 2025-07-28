export class DownloadDialogResultData {

  constructor(
    public source: string[],
    public targetFilename: string,
    public targetDirectory: string,
    public password: string,
    public format: string,
    public compressionLevel: number
  ) {
  }
} 