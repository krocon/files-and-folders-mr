import {FileItemIf} from "@fnf-data";

export class UnzipDialogData {

  constructor(
    public source: FileItemIf,
    public targetDir = "",
    public directories: string[] = []
  ) {
  }
}
