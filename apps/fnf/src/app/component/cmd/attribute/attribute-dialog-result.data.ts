import {FileItemIf, FileAttributeType} from "@fnf-data";

export class AttributeDialogResultData {

  constructor(
    public source: FileItemIf,
    public attributes: FileAttributeType,
    public changeDateTime: boolean,
    public newDate?: string,
    public newTime?: string,
    public pluginAction?: string,
    public pluginValue?: string
  ) {
  }
}