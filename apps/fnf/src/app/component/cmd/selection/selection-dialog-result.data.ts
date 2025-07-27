import {FileItemIf} from "@fnf-data";

export class SelectionDialogResultData {

  constructor(
    public source: FileItemIf,
    public target: FileItemIf,
  ) {
  }
}
