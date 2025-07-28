export class DownloadDialogData {

  constructor(
    public source: string[] = [],
    public targetFilename = "",
    public targetDirectory = "",
    public password = "",
    public format = "7z",
    public compressionLevel = 5,
    public directories: string[] = []
  ) {
  }
} 