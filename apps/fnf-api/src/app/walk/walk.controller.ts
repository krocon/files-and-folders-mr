import {Controller, Post} from "@nestjs/common";
import {MessageBody} from "@nestjs/websockets";
import {FileItem, FileItemIf, WalkData, WalkParaData} from "@fnf-data";
import * as fs from "fs-extra";
import * as path from "path";
import * as micromatch from "micromatch";
import {AppLoggerService} from "../shared/logger.service";


@Controller()
export class DirController {

  constructor(private readonly logger: AppLoggerService) {
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
      } catch (error) {
        // Log the error but continue processing other files
        this.logger.warn(
          `Skipping inaccessible file: ${f}`,
          'DirController'
        );
        this.logger.logWithMetadata(
          'warn',
          `File access error details`,
          {
            filePath: f,
            error: error.message,
            operation: 'initial_file_access'
          },
          'DirController'
        );
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
            } catch (error) {
              this.logger.warn(
                `Error getting file stats for: ${entryPath}`,
                'DirController'
              );
              this.logger.logWithMetadata(
                'warn',
                `File stats error details`,
                {
                  filePath: entryPath,
                  error: error.message,
                  operation: 'file_stats'
                },
                'DirController'
              );
              // Continue with size = 0 as default
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
        } catch (error) {
          const directoryPath = path.join(currentItem.dir, currentItem.base);
          this.logger.warn(
            `Error reading directory: ${directoryPath}`,
            'DirController'
          );
          this.logger.logWithMetadata(
            'warn',
            `Directory reading error details`,
            {
              directoryPath,
              error: error.message,
              operation: 'directory_read'
            },
            'DirController'
          );
          // Continue processing other directories
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
