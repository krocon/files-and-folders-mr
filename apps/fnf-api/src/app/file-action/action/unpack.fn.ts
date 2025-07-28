import {DirEvent, DirEventIf, FilePara, fixPath} from "@fnf-data";
import * as path from "path";
import * as fs from "fs";

import {extractFull, ExtractFullOptions} from "node-7z";
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
    // Don't throw here - let the extraction attempt proceed and fail naturally if needed
  }
}

/**
 * Extracts the contents of an archive file to a target directory
 *
 * This function extracts all files and directories from an archive based on the source and target
 * information in the FilePara object. It uses the node-7z library with 7zip-bin to handle the extraction.
 *
 * The source parameter specifies the archive file to extract, and the target parameter specifies 
 * the directory where the contents should be extracted to.
 *
 * @param para - The FilePara object containing source (archive file) and target (extraction directory) information
 * @returns A Promise resolving to an empty array of DirEventIf objects
 * @throws Error if the source or target is invalid, or if the extraction fails
 */
export async function unpack(para: FilePara): Promise<DirEventIf[]> {
  if (!para || !para.source || !para.target) {
    throw new Error("Invalid argument exception!");
  }
  const ptarget = para.target;
  const psource = para.source;

  const sourceUrl = fixPath(
    path.join(psource.dir, "/", psource.base ? psource.base : "")
  );
  const targetUrl = fixPath(
    path.join(ptarget.dir, ptarget.base ? ptarget.base : "")
  );

  fse.ensureDirSync(targetUrl);

  return new Promise<DirEventIf[]>(async (resolve, reject) => {
    try {
      const pathTo7zip = sevenBin.path7za;

      // Ensure the 7zip binary has execute permissions
      await ensure7zipExecutable(pathTo7zip);

      let options: ExtractFullOptions = {
        $bin: pathTo7zip
      };
      const stream = extractFull(sourceUrl, targetUrl, options);

      stream.on('end', () => {
        resolve([
          new DirEvent("", [], true, true, 0, "", "reload", 0),
          new DirEvent("", [], true, true, 0, "", "reload", 1)
        ]);
      });

      stream.on('error', (err) => {
        console.info('sourceUrl', sourceUrl);
        console.info('targetUrl', targetUrl);
        console.error(err.message, err);
        reject(err);
      });

    } catch (e) {
      console.info('sourceUrl', sourceUrl);
      console.info('targetUrl', targetUrl);
      console.error(e.message, e);
      reject(e);
    }
  });
}
