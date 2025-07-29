import {Injectable} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as child_process from 'child_process';
import {promisify} from 'util';
import {FileItemIf, SetFileAttributesData} from "@fnf-data";

/**
 * Service responsible for managing file system attributes (metadata properties)
 * across different operating systems.
 *
 * This service provides functionality to:
 * - Read file attributes like hidden, archive, readonly, and system flags
 * - Set file attributes on supported platforms
 *
 * The implementation is platform-aware and provides different behavior for:
 * - Windows: Uses PowerShell commands to get/set full attribute support
 * - macOS/Linux: Uses native filesystem operations with limited attribute support
 *
 * @example
 * // Injecting the service in a controller
 * constructor(private readonly fileAttributeService: FileAttributeService) {}
 *
 * // Reading file attributes
 * async function getAttributes() {
 *   const fileItem = {
 *     dir: '/path/to/directory',
 *     base: 'example.txt',
 *     ext: '.txt',
 *     size: 1024,
 *     date: '2023-05-15T10:30:00',
 *     isDir: false,
 *     abs: false
 *   };
 *
 *   const result = await fileAttributeService.getFileAttributes(fileItem);
 *   console.log(result.attributes);
 *   // Output: { hidden: false, archive: true, readonly: false, system: false }
 * }
 *
 * // Setting file attributes
 * async function setAttributes() {
 *   const fileItem = {
 *     dir: '/path/to/directory',
 *     base: 'example.txt',
 *     ext: '.txt',
 *     size: 1024,
 *     date: '2023-05-15T10:30:00',
 *     isDir: false,
 *     abs: false
 *   };
 *
 *   const attributesData = new SetFileAttributesData(
 *     fileItem,
 *     { hidden: true, archive: false, readonly: true, system: false }
 *   );
 *
 *   await fileAttributeService.setFileAttributes(attributesData);
 *   // File now has hidden and readonly attributes set
 * }
 */



const exec = promisify(child_process.exec);

@Injectable()
export class FileAttributeService {

  /**
   * Retrieves file attributes for a given file item.
   *
   * This method determines the file's attributes (hidden, archive, readonly, system)
   * based on the current operating system:
   *
   * - On Windows: Uses PowerShell to query complete file attributes
   * - On macOS/Linux:
   *   - Hidden: Determined by filename starting with "."
   *   - Readonly: Determined by file permissions (owner write bit)
   *   - Archive/System: Not natively supported on Unix-like systems
   *
   * @param fileItem - The file item to get attributes for, containing directory and base name information
   * @returns A Promise resolving to the updated fileItem with attributes property populated
   *
   * @example
   * // Example usage in a controller method
   * async getAttributes(fileItem: FileItemIf) {
   *   try {
   *     const result = await this.fileAttributeService.getFileAttributes(fileItem);
   *     console.log(`File ${result.base} attributes:`, result.attributes);
   *     return result;
   *   } catch (error) {
   *     console.error('Failed to get file attributes:', error);
   *     throw error;
   *   }
   * }
   */
  async getFileAttributes(fileItem: FileItemIf): Promise<FileItemIf> {
    const platform = os.platform();
    const filePath = fileItem.dir + '/' + fileItem.base;
    const stats = await fs.stat(filePath);
    const basename = fileItem.base;

    let hidden = false;
    let archive = false;
    let readonly = false;
    let system = false;

    if (platform === 'win32') {
      // Windows: use PowerShell to get attributes
      const {stdout} = await exec(`powershell -command "(Get-Item '${filePath}').Attributes"`);
      const attrs = stdout.toLowerCase();

      hidden = attrs.includes('hidden');
      system = attrs.includes('system');
      readonly = attrs.includes('readonly');
      archive = attrs.includes('archive');
    } else {
      // macOS / Linux
      hidden = basename.startsWith('.');
      system = false; // not supported natively
      readonly = !(stats.mode & 0o200); // owner write bit
      archive = false; // not supported natively on Unix/Linux
    }
    fileItem.attributes = {hidden, archive, readonly, system};
    return fileItem;
  }

  /**
   * Sets file attributes for a given file.
   *
   * This method modifies the file's attributes (hidden, archive, readonly, system)
   * based on the current operating system:
   *
   * - On Windows: Uses PowerShell to set all supported attributes
   *   - Can set/clear hidden, archive, readonly, and system flags
   *   - Sets to 'Normal' when clearing all attributes
   *
   * - On macOS/Linux: Limited attribute support
   *   - Readonly: Implemented by modifying file permissions (owner write bit)
   *   - Hidden/Archive/System: Not directly supported on Unix-like systems
   *     (Note: Hidden files are typically named with a leading dot, but this method
   *     does not rename files to implement hidden status)
   *
   * @param para - An object containing the fileItem and attributes to set
   * @returns A Promise that resolves when the operation is complete
   *
   * @example
   * // Example usage in a controller method
   * async modifyAttributes() {
   *   const fileItem = {
   *     dir: '/Users/username/Documents',
   *     base: 'important-file.txt',
   *     ext: '.txt',
   *     size: 2048,
   *     date: '2023-06-20T14:25:00',
   *     isDir: false,
   *     abs: false
   *   };
   *
   *   // Make the file read-only and hidden
   *   const attributesData = new SetFileAttributesData(
   *     fileItem,
   *     { hidden: true, archive: false, readonly: true, system: false }
   *   );
   *
   *   await this.fileAttributeService.setFileAttributes(attributesData);
   *   console.log('File attributes updated successfully');
   * }
   */
  async setFileAttributes(para: SetFileAttributesData): Promise<void> {
    const filePath = para.fileItem.dir + '/' + para.fileItem.base;
    const attributes = para.attributes;
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows: use PowerShell to set attributes
      const attrs: string[] = [];

      if (attributes.hidden) attrs.push('Hidden');
      if (attributes.archive) attrs.push('Archive');
      if (attributes.readonly) attrs.push('ReadOnly');
      if (attributes.system) attrs.push('System');

      if (attrs.length > 0) {
        const attrString = attrs.join(',');
        await exec(`powershell -command "Set-ItemProperty -Path '${filePath}' -Name Attributes -Value '${attrString}'"`);
      } else {
        // Clear all attributes
        await exec(`powershell -command "Set-ItemProperty -Path '${filePath}' -Name Attributes -Value 'Normal'"`);
      }
    } else {
      // macOS / Linux - limited support
      const stats = await fs.stat(filePath);
      let mode = stats.mode;

      // Handle readonly attribute by modifying write permissions
      if (attributes.readonly) {
        mode = mode & ~0o200; // Remove owner write permission
      } else {
        mode = mode | 0o200; // Add owner write permission
      }

      await fs.chmod(filePath, mode);

      // Note: hidden, archive, and system attributes are not natively supported on Unix/Linux
      // Hidden files are handled by filename convention (starting with '.')
    }
  }
}