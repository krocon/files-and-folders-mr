import {FileItemIf} from "@fnf-data";

export class RenameDialogResultData {

  constructor(
    public source: FileItemIf,
    public target: FileItemIf,
  ) {
  }
}
