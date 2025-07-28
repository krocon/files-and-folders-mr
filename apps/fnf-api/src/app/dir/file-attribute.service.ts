import {Injectable} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import {promisify} from 'util';
import {FileAttributeType, FileItemIf, SetFileAttributesData} from "@fnf-data";


const exec = promisify(child_process.exec);

@Injectable()
export class FileAttributeService {


  async apiUrlAttribute(fileItem: FileItemIf): Promise<FileItemIf> {
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
