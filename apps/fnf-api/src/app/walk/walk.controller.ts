import {Controller, Post} from "@nestjs/common";
import {MessageBody} from "@nestjs/websockets";
import {FileItem, FileItemIf, WalkData, WalkParaData} from "@fnf-data";
import * as fs from "fs-extra";
import * as path from "path";
import * as micromatch from "micromatch";


@Controller()
export class DirController {

  constructor() {
  }

  @Post("walkdirsync")
  async walkdirSync(@MessageBody() walkParaData: WalkParaData): Promise<WalkData> {
    const walkData = new WalkData(0, 0, 0, false);
    const files: FileItemIf[] = [];

    // Process initial files asynchronously
    const initialFiles: FileItemIf[] = [];
    for (const f of walkParaData.files) {
      try {
        await fs.access(f); // Check if file exists
        const stats = await fs.stat(f);
        const parsedPath = path.parse(f);
        initialFiles.push(new FileItem(
          parsedPath.dir,
          parsedPath.base,
          parsedPath.ext,
          '', // date
          stats?.size ?? 0,
          stats.isDirectory(),
          path.isAbsolute(f) // abs
        ));
      } catch (e) {
        // File doesn't exist or can't be accessed, skip it
      }
    }

    // Add initial files to the processing queue
    files.push(...initialFiles);

    // Initialize walkData with zero counts (files will be counted during processing)
    // This prevents double counting of initial files

    // Process all files and directories
    while (files.length > 0) {
      const currentItem = files.pop();

      if (currentItem.isDir) {
        // Process directory
        if (this.matchesPattern(currentItem, walkParaData.filePattern)) {
          walkData.folderCount++;
        }

        try {
          const fullDirPath = path.join(currentItem.dir, currentItem.base);
          const entries = await fs.readdir(fullDirPath, {withFileTypes: true});

          for (const entry of entries) {
            const entryPath = path.join(fullDirPath, entry.name);
            const parsedPath = path.parse(entryPath);
            const isDir = entry.isDirectory();
            let size = 0;

            try {
              if (!isDir) {
                const stats = await fs.lstat(entryPath);
                size = stats.size;
              }
            } catch (e) {
              console.warn('Error getting file stats: ' + entryPath);
            }

            files.push(new FileItem(
              parsedPath.dir,
              parsedPath.base,
              parsedPath.ext,
              '', // date
              size,
              isDir,
              path.isAbsolute(entryPath) // abs
            ));
          }
        } catch (e) {
          console.warn('Error reading directory: ' + path.join(currentItem.dir, currentItem.base));
        }
      } else {
        // Process file
        if (this.matchesPattern(currentItem, walkParaData.filePattern)) {
          walkData.fileCount++;
          walkData.sizeSum += currentItem.size;
        }
      }
    }

    // Mark as complete
    walkData.last = true;
    walkData.timestamp = Date.now();

    return walkData;
  }

  private matchesPattern(item: FileItemIf, pattern: string): boolean {
    if (!pattern) {
      return false;
    }
    return micromatch.isMatch(path.join(item.dir, item.base), pattern);
  }
}
