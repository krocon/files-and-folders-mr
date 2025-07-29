import {Injectable} from "@nestjs/common";
import {Config, DirEvent, DirEventIf, DirPara, FileItem, fixPath, getZipUrlInfo, isZipUrl} from "@fnf-data";

import * as fs from "fs-extra";
import * as path from "path";
import {stats2FileItem} from "./stats-to-file";
import {unpacklist} from "../file-action/action/unpack-list.fn";

/**
 * Service for reading directory contents and handling special file path cases.
 * This service provides functionality to read directory contents from different sources including:
 * - Regular filesystem directories
 * - Docker container paths
 * - Zip archives
 */
@Injectable()
export class DirService {
  static config: Config = new Config();

  /**
   * Reads the contents of a directory and returns file and folder information.
   *
   * This method handles three different scenarios:
   * 1. Docker container paths - when path matches dockerRoot configuration
   * 2. Zip archive paths - when path matches the zip URL pattern
   * 3. Regular filesystem paths - for standard directory listing
   *
   * The method returns an array of DirEvent objects which contain information about
   * the directory contents including file/folder names, sizes, and metadata.
   *
   * @param para - Directory parameters object containing path and other options
   * @returns A Promise resolving to an array of DirEvent objects with directory contents
   *
   * @example
   * // List contents of a regular directory
   * const dirService = new DirService();
   * dirService.readdir(new DirPara('/home/user/documents'))
   *   .then(dirEvents => {
   *     // dirEvents contains file and folder information
   *     const files = dirEvents[0].items;
   *     console.log(`Found ${files.length} items in directory`);
   *
   *     // Access file properties
   *     files.forEach(file => {
   *       console.log(`Name: ${file.base}, Size: ${file.size}, IsDir: ${file.isDir}`);
   *     });
   *   })
   *   .catch(error => console.error('Error reading directory:', error));
   *
   * @example
   * // List contents of a zip file
   * dirService.readdir(new DirPara('/path/to/archive.zip:/'))
   *   .then(dirEvents => {
   *     // dirEvents contains files and folders inside the zip
   *     const zipContents = dirEvents[0].items;
   *     console.log(`Zip contains ${zipContents.length} items`);
   *   })
   *   .catch(error => console.error('Error reading zip:', error));
   *
   * @example
   * // List Docker container paths
   * // First configure the service with Docker root and container paths
   * DirService.config = new Config(
   *   [], // incompatiblePaths
   *   ['/container1', '/container2'], // containerPaths
   *   '', // startPath
   *   '/docker' // dockerRoot
   * );
   *
   * dirService.readdir(new DirPara('/docker'))
   *   .then(dirEvents => {
   *     // dirEvents contains available Docker containers as directories
   *     const containers = dirEvents[0].items;
   *     console.log(`Found ${containers.length} containers`);
   *   })
   *   .catch(error => console.error('Error listing containers:', error));
   */
  readdir(para: DirPara): Promise<DirEvent[]> {
    const p = para.path;

    if (DirService.config.dockerRoot === p && DirService.config.containerPaths) {
      return new Promise<DirEventIf[]>((resolve, reject) => {
        const fileItems = DirService.config
          .containerPaths
          .map(s => {
            const base = fixPath(s.replace(p, ''))
              .replace(/^\//g, '');
            const fileItem = new FileItem(p, base, path.extname(base), null, 0, true);
            this.addStats2FileItem(fileItem);
            return fileItem;
          });
        resolve([new DirEvent(p, fileItems, true, true, fileItems.length, "", "list")]);
      });
    }

    if (isZipUrl(p)) {
      const zipUrlInfo = getZipUrlInfo(p);

      return new Promise<DirEventIf[]>((resolve, reject) => {
        unpacklist(zipUrlInfo.zipUrl)
          .then(dirEvents => {
            return resolve(dirEvents);
          }, error => reject(error));
      });

    } else {
      return new Promise<DirEventIf[]>((resolve, reject) => {

        const fileItems: FileItem[] = [];
        try {
          if (fs.existsSync(p)) {
            const files = fs.readdirSync(p);
            for (let idx = 0; idx < files.length; idx++) {
              const f = files[idx];

              const fileItem = new FileItem(
                p,
                fixPath(f),
                path.extname(f),
              );
              fileItems.push(fileItem);
              this.addStats2FileItem(fileItem);

            } // for
            resolve([new DirEvent(p, fileItems, true, true, fileItems.length, "", "list")]);

          } else {
            resolve([new DirEvent(p, fileItems, true, true, fileItems.length, "Error: Folder does not exist: " + p, "list")]);
          }

        } catch (e) {
          console.error(e);
          reject(e);
        }
      });
    }
  }

  /**
   * Adds file statistics to a FileItem object.
   *
   * This helper method retrieves file system stats for the given FileItem and
   * populates its properties like size, date, and isDir flag.
   * If there's an error retrieving stats, it's added to the FileItem's meta.error property.
   *
   * @param fileItem - The FileItem to populate with statistics
   * @private
   */
  private addStats2FileItem(fileItem: FileItem): void {
    const ff = path.join(fileItem.dir, "/", fileItem.base);
    try {
      const stats = fs.statSync(ff);
      stats2FileItem(stats, fileItem);

    } catch (e) {
      if (!fileItem.meta) fileItem.meta = {};
      fileItem.meta.error = e;
      console.info("DirGateWay() stats error:", e.message);
    }
  }

}