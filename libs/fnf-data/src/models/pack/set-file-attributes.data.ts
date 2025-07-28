import {FileAttributeType} from "../dir/file-attribute.type";
import {FileItemIf} from "../dir/file-item.if";

export class SetFileAttributesData {
  constructor(
    public fileItem: FileItemIf,
    public attributes: FileAttributeType,
    public changeDateTime?: boolean,
    public newDate?: string,
    public newTime?: string
  ) {
  }
}