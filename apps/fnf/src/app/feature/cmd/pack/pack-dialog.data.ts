import {PackDialogData as PackDialogDataModel, PackDialogResultData as PackDialogResultDataModel} from "@fnf-data";

export class PackDialogData extends PackDialogDataModel {
  constructor(
    source: string[] = [],
    targetFilename = "",
    targetDirectory = "",
    password = "",
    format = "7z",
    compressionLevel = 5,
    directories: string[] = []
  ) {
    super(source, targetFilename, targetDirectory, password, format, compressionLevel, directories);
  }
}

export class PackDialogResultData extends PackDialogResultDataModel {
  constructor(
    source: string[],
    targetFilename: string,
    targetDirectory: string,
    password: string,
    format: string,
    compressionLevel: number
  ) {
    super(source, targetFilename, targetDirectory, password, format, compressionLevel);
  }
} 