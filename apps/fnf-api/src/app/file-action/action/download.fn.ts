import {DirEvent, DirEventIf, FilePara, fixPath} from "@fnf-data";
import * as path from "path";
import * as fs from "fs";
import * as fse from "fs-extra";
import {Response} from "express";

/**
 * Downloads a single file or creates an archive for multiple files
 *
 * This function handles downloading files by either:
 * 1. For a single file: Streams the file directly to the response
 * 2. For multiple files: Creates a temporary archive and streams it to the response
 *
 * @param para - The FilePara object containing source files/directories
 * @param res - Express response object for streaming the download
 * @returns A Promise resolving to void (response is handled directly)
 * @throws Error if the source is invalid or if the download fails
 */
export async function download(para: any, res: Response): Promise<void> {
  if (!para || !para.source) {
    throw new Error("Invalid argument exception!");
  }
  
  const psource = para.source;

  // Extract download-specific parameters from the para object
  const downloadData = para as any; // Cast to access download-specific properties
  const password = downloadData.password || "";
  const format = downloadData.format || "7z";
  const compressionLevel = downloadData.compressionLevel || 5;
  const targetFilename = downloadData.targetFilename || "download";

  // Convert source FileItemIf[] to string array
  const sourcePaths: string[] = [];
  if (Array.isArray(psource)) {
    sourcePaths.push(...psource.map(item => path.join(item.dir, item.base)));
  } else {
    sourcePaths.push(path.join(psource.dir, psource.base));
  }

  if (sourcePaths.length === 1) {
    // Single file download
    const filePath = sourcePaths[0];
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    // Set response headers for file download
    const filename = path.basename(filePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size.toString());

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    return new Promise<void>((resolve, reject) => {
      fileStream.on('end', () => {
        resolve();
      });
      fileStream.on('error', (err) => {
        reject(err);
      });
    });

  } else {
    // Multiple files - create archive
    const {add, AddOptions} = require("node-7z");
    const sevenBin = require("7zip-bin");

    // Create temporary directory for the archive
    const tempDir = path.join(process.cwd(), 'temp');
    fse.ensureDirSync(tempDir);
    
    const tempArchivePath = path.join(tempDir, `${targetFilename}.${getExtensionForFormat(format)}`);

    try {
      const pathTo7zip = sevenBin.path7za;

      // Ensure the 7zip binary has execute permissions
      await ensure7zipExecutable(pathTo7zip);

      let options: any = {
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

      // Create the archive
      await new Promise<void>((resolve, reject) => {
        const stream = add(tempArchivePath, sourcePaths, options);
        
        stream.on('end', () => {
          resolve();
        });
        
        stream.on('error', (err) => {
          reject(err);
        });
      });

      // Stream the archive to the response
      const stats = fs.statSync(tempArchivePath);
      const filename = `${targetFilename}.${getExtensionForFormat(format)}`;
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', stats.size.toString());

      const archiveStream = fs.createReadStream(tempArchivePath);
      archiveStream.pipe(res);

      return new Promise<void>((resolve, reject) => {
        archiveStream.on('end', () => {
          // Clean up temporary file
          try {
            fs.unlinkSync(tempArchivePath);
          } catch (e) {
            console.warn('Failed to clean up temporary archive:', e);
          }
          resolve();
        });
        archiveStream.on('error', (err) => {
          // Clean up temporary file on error
          try {
            fs.unlinkSync(tempArchivePath);
          } catch (e) {
            console.warn('Failed to clean up temporary archive:', e);
          }
          reject(err);
        });
      });

    } catch (error) {
      // Clean up temporary file on error
      try {
        if (fs.existsSync(tempArchivePath)) {
          fs.unlinkSync(tempArchivePath);
        }
      } catch (e) {
        console.warn('Failed to clean up temporary archive:', e);
      }
      throw error;
    }
  }
}

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
 * Gets the file extension for a given format
 */
function getExtensionForFormat(format: string): string {
  const extensions: Record<string, string> = {
    '7z': '7z',
    'zip': 'zip',
    'tar': 'tar',
    'gzip': 'tar.gz'
  };
  return extensions[format] || '7z';
} 