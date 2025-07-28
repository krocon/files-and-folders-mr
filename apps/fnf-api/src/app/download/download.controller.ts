import {Body, Controller, Post, Res} from "@nestjs/common";
import {DownloadDialogResultData, FileItemIf} from "@fnf-data";
import * as path from "path";
import * as fs from "fs";
import * as fse from "fs-extra";
import type {Response} from "express";
import {add} from "node-7z";
import * as sevenBin from "7zip-bin";

/**
 * Controller responsible for handling file download operations
 *
 * This controller provides endpoints for downloading files from the server. It supports:
 * - Single file downloads (direct streaming)
 * - Multiple file downloads (creates and streams compressed archives)
 * - Password protection for archives
 * - Multiple compression formats (7z, zip, tar, gzip)
 * - Configurable compression levels
 *
 * @example
 * // Client-side example using axios
 * const downloadFiles = async (files, options) => {
 *   try {
 *     const response = await axios.post('/download/download', {
 *       source: ['/path/to/file1.txt', '/path/to/file2.pdf'],
 *       targetFilename: 'my-archive',
 *       targetDirectory: '/tmp',
 *       password: 'secret123',      // Optional password protection
 *       format: 'zip',              // '7z', 'zip', 'tar', or 'gzip'
 *       compressionLevel: 9         // 0-9, where 9 is maximum compression
 *     }, {
 *       responseType: 'blob'
 *     });
 *
 *     // Create download link
 *     const url = window.URL.createObjectURL(new Blob([response.data]));
 *     const link = document.createElement('a');
 *     link.href = url;
 *     link.setAttribute('download', 'my-archive.zip');
 *     document.body.appendChild(link);
 *     link.click();
 *     link.remove();
 *   } catch (error) {
 *     console.error('Download failed:', error);
 *   }
 * };
 */
@Controller("download")
export class DownloadController {


  @Post("")
  async download(@Body() data: DownloadDialogResultData, @Res() res: Response) {
    try {

      await this.doDownload(data, res);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({error: error.message});
    }
  }

  /**
   * Processes download requests for files or archives
   *
   * This method handles the core download functionality:
   * 1. For single files: Directly streams the file to the client
   * 2. For multiple files: Creates a compressed archive and streams it to the client
   *
   * The method supports multiple compression formats (7z, zip, tar, gzip) with
   * configurable compression levels and optional password protection.
   *
   * @param data - The download configuration data containing source files and options
   * @param res - Express Response object for sending the file or archive
   *
   * @example
   * // Inside controller method:
   * await this.doDownload({
   *   source: ['/path/to/file.txt'],
   *   targetFilename: 'document',
   *   targetDirectory: '/tmp',
   *   password: '',
   *   format: '7z',
   *   compressionLevel: 5
   * }, response);
   *
   * @throws Error if source files are invalid or if file operations fail
   * @returns Promise that resolves when download is complete
   */
  private async doDownload(data: DownloadDialogResultData, res: Response): Promise<void> {

    // Convert DownloadDialogResultData to FilePara format
    const sourceItems: FileItemIf[] =
      data.source
        .map(filePath => {
          const parts = filePath.split('/');
          const base = parts.pop() || '';
          const dir = parts.join('/') || '/';
          const fullPath = path.join(dir, base);

          let stats;
          try {
            stats = fs.statSync(fullPath);
          } catch (e) {
            stats = {size: 0, isDirectory: () => false};
          }

          return {
            dir: dir,
            base: base,
            ext: base.includes('.') ? '.' + base.split('.').pop() || '' : '',
            size: stats.size || 0,
            date: new Date().toISOString(),
            isDir: stats.isDirectory(),
            abs: true,
            meta: undefined
          } as FileItemIf;
        });

    const para = {
      cmd: 'download' as const,
      source: sourceItems,
      target: {
        dir: data.targetDirectory,
        base: data.targetFilename,
        ext: this.getExtensionForFormat(data.format)
      },
      password: data.password,
      format: data.format,
      compressionLevel: data.compressionLevel
    };

    if (!para || !para.source) {
      throw new Error("Invalid argument exception!");
    }

    const psource = para.source;

    // Extract download-specific parameters from the data object
    const password = data.password || "";
    const format = data.format || "7z";
    const compressionLevel = data.compressionLevel || 5;
    const targetFilename = data.targetFilename || "download";

    // Convert source FileItemIf[] to string array
    const sourcePaths: string[] = psource.map(item => path.join(item.dir, item.base));

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

      // Create temporary directory for the archive
      const tempDir = path.join(process.cwd(), 'temp');
      fse.ensureDirSync(tempDir);

      const tempArchivePath = path.join(tempDir, `${targetFilename}.${this.getExtensionForFormat(format)}`);

      try {
        const pathTo7zip = sevenBin.path7za;

        // Ensure the 7zip binary has execute permissions
        await this.ensure7zipExecutable(pathTo7zip);

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
        const filename = `${targetFilename}.${this.getExtensionForFormat(format)}`;

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
  private async ensure7zipExecutable(binaryPath: string): Promise<void> {
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
   * Gets the file extension for a given compression format
   *
   * Maps format names to their corresponding file extensions.
   *
   * @param format - The compression format name ('7z', 'zip', 'tar', or 'gzip')
   * @returns The appropriate file extension for the format (including the dot)
   *
   * @example
   * // Returns '7z'
   * this.getExtensionForFormat('7z');
   *
   * // Returns 'tar.gz'
   * this.getExtensionForFormat('gzip');
   */
  private getExtensionForFormat(format: string): string {
    const extensions: Record<string, string> = {
      '7z': '7z',
      'zip': 'zip',
      'tar': 'tar',
      'gzip': 'tar.gz'
    };
    return extensions[format] || '7z';
  }
}