import {DirEvent, DirEventIf, FilePara, fixPath} from "@fnf-data";
import * as path from "path";
import * as fs from "fs";

import {add, AddOptions} from "node-7z";
import * as sevenBin from "7zip-bin";
import * as fse from "fs-extra";

/**
 * Ensures the 7zip binary has execute permissions
 * This prevents EACCES errors that can occur when the binary doesn't have proper permissions
 *
 * @param binaryPath - Path to the 7zip binary
 */
async function ensure7zipExecutable(binaryPath: string): Promise<void> {
  try {
    // Check if file exists
    if (!fs.existsSync(binaryPath)) {
      throw new Error(`7zip binary not found at: ${binaryPath}`);
    }

    // Check current permissions
    const stats = fs.statSync(binaryPath);
    const isExecutable = !!(stats.mode & parseInt('111', 8)); // Check if any execute bit is set

    if (!isExecutable) {
      // Add execute permissions (chmod +x equivalent)
      fs.chmodSync(binaryPath, stats.mode | parseInt('111', 8));
      console.info(`Fixed permissions for 7zip binary: ${binaryPath}`);
    }
  } catch (error) {
    console.warn(`Warning: Could not ensure 7zip binary is executable: ${error.message}`);
    // Don't throw here - let the compression attempt proceed and fail naturally if needed
  }
}

/**
 * Creates a compressed archive from source files/directories
 *
 * This function creates an archive file from the specified sources using the node-7z library
 * with 7zip-bin. The target parameter specifies the output archive file path.
 *
 * @param para - The FilePara object containing source files/directories and target archive file
 * @returns A Promise resolving to an array of DirEventIf objects
 * @throws Error if the source or target is invalid, or if the compression fails
 */
export async function pack(para: FilePara): Promise<DirEventIf[]> {
  if (!para || !para.source || !para.target) {
    throw new Error("Invalid argument exception!");
  }
  
  const ptarget = para.target;
  const psource = para.source;

  // Extract pack-specific parameters from the para object
  const packData = para as any; // Cast to access pack-specific properties
  const password = packData.password || "";
  const format = packData.format || "7z";
  const compressionLevel = packData.compressionLevel || 5;

  const targetUrl = fixPath(
    path.join(ptarget.dir, ptarget.base ? ptarget.base : "")
  );

  // Ensure target directory exists
  const targetDir = path.dirname(targetUrl);
  fse.ensureDirSync(targetDir);

  // Convert source FileItemIf[] to string array
  const sourcePaths: string[] = [];
  if (Array.isArray(psource)) {
    sourcePaths.push(...psource.map(item => path.join(item.dir, item.base)));
  } else {
    sourcePaths.push(path.join(psource.dir, psource.base));
  }

  return new Promise<DirEventIf[]>(async (resolve, reject) => {
    try {
      const pathTo7zip = sevenBin.path7za;

      // Ensure the 7zip binary has execute permissions
      await ensure7zipExecutable(pathTo7zip);

      let options: AddOptions = {
        $bin: pathTo7zip,
        recursive: true,
        $progress: false
      };

      // Add format-specific options
      if (format === "7z") {
        options.$7z = `-mx${compressionLevel}`;
        if (password) {
          options.$7z += ` -p${password}`;
        }
      } else if (format === "zip") {
        options.$zip = `-${compressionLevel}`;
        if (password) {
          options.$zip += ` -P${password}`;
        }
      } else if (format === "tar") {
        // TAR doesn't support compression levels or passwords
        options.$tar = "";
      } else if (format === "gzip") {
        options.$gzip = `-${compressionLevel}`;
      }

      const stream = add(targetUrl, sourcePaths, options);

      stream.on('end', () => {
        resolve([
          new DirEvent("", [], true, true, 0, "", "reload", 0),
          new DirEvent("", [], true, true, 0, "", "reload", 1)
        ]);
      });

      stream.on('error', (err) => {
        console.info('targetUrl', targetUrl);
        console.info('sourcePaths', sourcePaths);
        console.error(err.message, err);
        reject(err);
      });

    } catch (e) {
      console.info('targetUrl', targetUrl);
      console.info('sourcePaths', sourcePaths);
      console.error(e.message, e);
      reject(e);
    }
  });
} 