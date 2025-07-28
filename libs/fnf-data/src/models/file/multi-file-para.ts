import {FileCmd, FileItemIf} from "@fnf-data";


export class MultiFilePara {

  constructor(
    public source: FileItemIf[] = [],
    public targetDir?: FileItemIf,
    public cmd: FileCmd = 'walk'
  ) {
  }
}
