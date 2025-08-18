import {ApplicationConfig, ApplicationRef, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient} from '@angular/common/http';
import {Socket, SOCKET_CONFIG_TOKEN, SocketIoConfig} from 'ngx-socket-io';


import {routes} from './app.routes';
import {ConfigService} from "./service/config/config.service";
import {SysinfoService} from "./service/sysinfo.service";
import {environment} from "../environments/environment";

import {FileSystemService} from "./service/file-system.service";
import {FileActionService} from "./feature/task/service/file-action.service";
import {GotoAnythingDialogService} from "./feature/cmd/gotoanything/goto-anything-dialog.service";
import {ToolService} from "./service/config/tool.service";
import {FiletypeExtensionsService} from "./service/config/filetype-extensions.service";
import {ConfigButtonsService} from "./service/config/config-buttons.service";
import {ConfigFiletypesService} from "./service/config/config-filetypes.service";
import {ConfigToolsService} from "./service/config/config-tools.service";
import {AiCompletionService} from "./service/ai/ai-completion.service";
import {GlobValidatorService} from "./service/glob-validator.service";
import {CleanService} from "./service/clean.service";
import {ShellService} from "./feature/shell/service/shell.service";
import {ShellAutocompleteService} from "./feature/shell/service/shell-autocomplete.service";
import {ServershellService} from "./feature/shell/service/servershell.service";
import {ServershellAutocompleteService} from "./feature/shell/service/servershell-autocomplete.service";
import {EditService} from "./service/edit.service";
import {DownloadService} from "./feature/cmd/download/download.service";
import {WalkdirService} from "./common/walkdir/walkdir.service";
import {WalkdirSyncService} from "./common/walkdir/walkdir-sync.service";
import {WalkSocketService} from "./common/walkdir/walk.socketio.service";
import {ShortcutService} from "./service/config/shortcut.service";
import {SearchPatternsService} from "./service/config/search-patterns.service";
import {PromptService} from "./service/config/prompt.service";
import {ConfigThemesService} from "./service/config/config-themes.service";
import {SetupPersistentService} from "./feature/setup/setup-persistent.service";


export function getChangedPort(url: string, ports: number[], index: number = 0) {
  const port = ports.length > index ? ports[index] : ports[0];
  return url.replace(/:\d\d\d\d/g, `:${port}`);
}


export async function initPorts() {

  const availableApiPorts: number[] = [];

  // Try to detect the correct API port by testing common ports
  const possiblePorts = [3333, 3335, 3337, 3339];

  async function checkApiPort(port: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    try {
      const isFileProtocol = location.protocol === 'file:';
      const protocol = isFileProtocol ? 'http:' : location.protocol;
      const hostname = isFileProtocol ? 'localhost' : (location.hostname || 'localhost');
      const url = `${protocol}//${hostname}:${port}/api/apiPortTest?t=${Date.now()}`;

      // const url = `${location.protocol}//${location.hostname}:${port}/api/apiPortTest?t=${Date.now()}`;


      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return port;
      }
      return null;

    } catch (error: Error | any) {
      clearTimeout(timeoutId);
      return null;
    }
  }

  async function checkSomeApiPortaAsync() {
    // Try each port:
    for (const port of possiblePorts) {
      const detectedPort = await checkApiPort(port);
      if (detectedPort) {
        availableApiPorts.push(detectedPort);
      }
    }
  }

  console.info('        > Waiting for API server...');
  await checkSomeApiPortaAsync();
  console.info('        > API Ports found  : ', availableApiPorts);

  return availableApiPorts;
}

async function init(): Promise<number[]> {

  const ports: number[] = await initPorts();

  // Set config to services:
  SetupPersistentService.forRoot(environment.setup);
  ConfigService.forRoot(environment.config);
  SysinfoService.forRoot(environment.sysinfo);
  ConfigThemesService.forRoot(environment.configThemes);
  ShortcutService.forRoot(environment.shortcut);
  FileSystemService.forRoot(environment.fileSystem);
  FileActionService.forRoot(environment.fileAction, ports);
  GotoAnythingDialogService.forRoot(environment.gotoAnything);
  ToolService.forRoot(environment.tool);
  FiletypeExtensionsService.forRoot(environment.filetypeExtensions);
  ConfigButtonsService.forRoot(environment.buttons);
  ConfigToolsService.forRoot(environment.tools);
  ConfigFiletypesService.forRoot(environment.filetypeExtensions);
  SearchPatternsService.forRoot(environment.searchPatterns);
  PromptService.forRoot(environment.prompt);
  AiCompletionService.forRoot(environment.multiRename);
  GlobValidatorService.forRoot(environment.checkGlob);
  CleanService.forRoot(environment.clean);
  ShellService.forRoot(environment.shell, ports);
  ShellAutocompleteService.forRoot(environment.shellAutocomplete);
  ServershellService.forRoot(environment.shell);
  ServershellAutocompleteService.forRoot(environment.shellAutocomplete);
  EditService.forRoot(environment.edit);
  DownloadService.forRoot(environment.download);

  WalkdirService.forRoot(environment.walkdir);
  WalkdirSyncService.forRoot(environment.walkdir);
  WalkSocketService.forRoot(environment.walkdir);

  console.info('        > Services configured');

  return ports;
}

// Factory function to create a Socket instance with the config and ApplicationRef
export function socketFactory(config: SocketIoConfig, appRef: ApplicationRef): Socket {
  return new Socket(config, appRef);
}

export async function getAppConfig(): Promise<ApplicationConfig> {
  console.info('Files and Folders');
  const ports: number[] = await init();

  // Compute Socket.IO URL: map first detected HTTP API port to WS port (+1)
  const isFileProtocol = location.protocol === 'file:';
  const protocol = isFileProtocol ? 'http:' : location.protocol;
  const hostname = isFileProtocol ? 'localhost' : (location.hostname || 'localhost');
  const wsPort = ((ports && ports.length > 0 ? ports[0] : 3333) + 1);
  const wsUrl = `${protocol}//${hostname}:${wsPort}`;

  const socketConfig: SocketIoConfig = {
    url: wsUrl,
    options: {
      reconnection: true,
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    }
  };

  return {
    providers: [
      provideZoneChangeDetection({eventCoalescing: true}),
      provideRouter(routes/*, withDebugTracing()*/),
      provideAnimations(),
      provideHttpClient(),
      {provide: SOCKET_CONFIG_TOKEN, useValue: socketConfig},
      {provide: Socket, useFactory: socketFactory, deps: [SOCKET_CONFIG_TOKEN, ApplicationRef]},
    ]
  }
}