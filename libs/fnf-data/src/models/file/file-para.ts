
import {PanelIndex} from "./panel-index";
import {FileItemIf} from "../dir/file-item.if";
import {FileCmd} from "./file-cmd";

export class FilePara {

  constructor(
    public source?: FileItemIf,
    public target?: FileItemIf,

    public sourcePanelIndex?: PanelIndex,
    public targetPanelIndex?: PanelIndex,

    public cmd: FileCmd = 'walk',
  ) {
  }
}
