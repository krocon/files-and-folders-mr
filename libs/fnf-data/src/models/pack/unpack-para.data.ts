import {FileItemIf} from "../dir/file-item.if";

export class UnpackParaData {

  constructor(
    public source: FileItemIf,
    public target: string,
    public password: string
  ) {
  }
}