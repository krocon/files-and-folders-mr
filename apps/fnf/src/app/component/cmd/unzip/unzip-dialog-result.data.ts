import {FileItemIf} from "@fnf-data";

export class UnzipDialogResultData {

  constructor(
    public source: FileItemIf,
    public target: string,
  ) {
  }
}
