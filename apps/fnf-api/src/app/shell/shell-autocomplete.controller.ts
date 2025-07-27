import {Controller, Get, Query} from '@nestjs/common';
import {platform} from 'os';
import {ShellCommandsWindows} from './shell-commands-windows';
import {ShellCommandsLinux} from './shell-commands-linux';
import {ShellCommandsMacOS} from './shell-commands-macos';
import { DirService } from '../dir/dir-service';
import * as path from 'path';
import {DirPara} from '@fnf-data';

@Controller('shell-autocomplete')
export class ShellAutocompleteController {
  constructor(
    private readonly windowsCommandsService: ShellCommandsWindows,
    private readonly linuxCommandsService: ShellCommandsLinux,
    private readonly macosCommandsService: ShellCommandsMacOS,
    private readonly dirService: DirService,
  ) {
  }

  @Get()
  async getAutocompleteSuggestions(@Query('input') input: string): Promise<string[]> {
    if (!input) {
      return [];
    }

    const os = this.detectOS();
    const commands = await this.getCommandsForOS(os);
    const commandsWithParams = await this.getCommandsWithParamsForOS(os);

    // Split input into tokens (simulate bash parsing)
    const tokens = input.trim().split(/\s+/);
    let lastToken = tokens[tokens.length - 1] || '';
    let dirCompletions: string[] = [];

    // If last token looks like a path or starts with ./, ../, /, ~, or contains a slash, try to complete as file/dir
    if (/^(~|\.|\/)/.test(lastToken) || lastToken.includes('/')) {
      let baseDir = '';
      let partial = '';
      if (lastToken.endsWith('/')) {
        baseDir = lastToken;
        partial = '';
      } else {
        baseDir = path.dirname(lastToken);
        partial = path.basename(lastToken);
      }
      // Expand ~ to home
      if (baseDir.startsWith('~')) {
        baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '', baseDir.slice(1));
      }
      if (baseDir === '.' || baseDir === '') baseDir = process.cwd();
      try {
        const dirPara = new DirPara(baseDir);
        const dirEvents = await this.dirService.readdir(dirPara);
        if (dirEvents && dirEvents.length > 0) {
          dirCompletions = dirEvents[0].items
            .filter(item => item.base.startsWith(partial))
            .map(item => path.join(baseDir, item.base) + (item.isDir ? '/' : ''));
        }
      } catch (e) {
        // ignore errors
      }
    }

    // Filter commands and commands with parameters that start with the input (case insensitive)
    const commandCompletions = commandsWithParams.filter(cmd =>
      cmd.toLowerCase().startsWith(input.toLowerCase())
    );

    // Merge and deduplicate
    return Array.from(new Set([...commandCompletions, ...dirCompletions]));
  }

  private detectOS(): 'windows' | 'linux' | 'macos' {
    const currentPlatform = platform();

    if (currentPlatform === 'win32') {
      return 'windows';
    } else if (currentPlatform === 'darwin') {
      return 'macos';
    } else {
      return 'linux';
    }
  }

  private async getCommandsForOS(os: 'windows' | 'linux' | 'macos'): Promise<string[]> {
    switch (os) {
      case 'windows':
        return this.windowsCommandsService.getCommands();
      case 'linux':
        return this.linuxCommandsService.getCommands();
      case 'macos':
        return this.macosCommandsService.getCommands();
      default:
        return [];
    }
  }

  private async getCommandsWithParamsForOS(os: 'windows' | 'linux' | 'macos'): Promise<string[]> {
    switch (os) {
      case 'windows':
        return this.windowsCommandsService.getCommandsWithParams();
      case 'linux':
        return this.linuxCommandsService.getCommandsWithParams();
      case 'macos':
        return this.macosCommandsService.getCommandsWithParams();
      default:
        return [];
    }
  }
}
