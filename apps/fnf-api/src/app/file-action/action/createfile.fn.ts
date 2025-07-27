import {DirEvent, DirEventIf, FileItem, FilePara, fixPath} from "@fnf-data";
import * as path from "path";
import * as fse from "fs-extra";


export async function createfile(para: FilePara): Promise<DirEventIf[]> {

  if (!para || !para.target) {
    throw new Error("Invalid argument exception! " + JSON.stringify(para));
  }


  /*
      "target": {
        "dir": "/Users/marckronberg/Filme.nosync",
        "base": "mk.txt",
        "ext": ".txt"
    },
   */

  const filename = para.target.base;
  const filePath = path.join(para.target.dir, filename);

  // Check if file already exists
  if (await fse.pathExists(filePath)) {
    throw new Error("File already exists");
  }

  // Ensure directory exists and create empty file
  await fse.ensureDir(para.target.dir);
  await fse.writeFile(filePath, '');

  const targetItem = new FileItem(para.target.dir, para.target.base, para.target.ext, new Date().toISOString(), 0, false);
  const item1 = new DirEvent(para.target.dir, [targetItem], false, false, 1, "", "add");
  const item2 = new DirEvent(para.target.dir, [], false, false, 1, "", "unselectall");
  const item3 = new DirEvent(para.target.dir, [targetItem], false, false, 1, "", "focus");
  return [item1, item2, item3];
}
