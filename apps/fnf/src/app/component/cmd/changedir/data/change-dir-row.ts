import {FileItem, FileItemIf} from '@fnf-data';

export class ChangeDirRow {
  constructor(
    public target: FileItemIf = new FileItem('')
  ) {
  }
}
