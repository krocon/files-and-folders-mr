import {Logger, Module} from "@nestjs/common";
import {ServeStaticModule} from "@nestjs/serve-static";
import {ConfigModule as NestConfigModule} from "@nestjs/config";

import {join} from "path";

import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {SysinfoModule} from "./sysinfo/sysinfo.module";
import {DrivesModule} from "./drives/drives.module";
import {FileModule} from "./file-content/file.module";
import {DownloadModule} from "./download/download.module";
import {FileActionModule} from "./file-action/file-action.module";
import {WalkModule} from "./walk/walk.module";
import {DirModule} from "./dir/dir.module";
import {CustomCssModule} from "./customcss/custom-css.module";
import {PathModule} from "./config/path/path.module";
import {FindModule} from "./find/find.module";
import {Config} from "@fnf-data";
import {FindFolderModule} from "./findfolder/find-folder.module";
import {ShellModule} from "./shell/shell.module";
import {VolumeModule} from "./volumes/volume.module";
import {CheckGlobModule} from "./checkglob/checkglob.module";
import {CleanModule} from "./clean/clean.module";
import {AiCompletionsModule} from "./ai/ai-completions.module";
import {ShortcutModule} from "./config/shortcut/shortcut.module";
import {FiletypeModule} from "./config/filetype/filetype.module";
import {ButtonModule} from "./config/button/button.module";
import {ToolModule} from "./config/tool/tool.module";
import {ThemeModule} from "./config/theme/theme.module";
import {SearchPatternModule} from "./config/search/search-pattern.module";
import {SetupModule} from "./config/setup/setup.module";
import {environment} from "../environments/environment";

export const config = new Config(
  process.env.FNF_INCOMPATIBLE_PATHS ? process.env.FNF_INCOMPATIBLE_PATHS.split(",") : [],
  process.env.FNF_CONTAINER_PATHS ? process.env.FNF_CONTAINER_PATHS.split(",") : [],
  process.env.FNF_START_PATH ? process.env.FNF_START_PATH :
    process.env.FNF_CONTAINER_PATHS ? process.env.FNF_CONTAINER_PATHS.split(",")[0] : '/',
  process.env.FNF_DOCKER_ROOT ? process.env.FNF_DOCKER_ROOT : undefined,
);

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/fnf-api/.env'],
    }),
    SysinfoModule,
    PathModule.forRoot(
      config
    ),
    DrivesModule.forRoot(
      config
    ),
    FileModule,
    DownloadModule,
    FileActionModule,
    WalkModule,
    VolumeModule,
    FindModule,
    ShellModule,
    FindFolderModule.forRoot(
      config
    ),
    DirModule.forRoot(
      config
    ),
    CustomCssModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "fnf") /* root of the compiled UI */
    }),
    AiCompletionsModule,
    CheckGlobModule,
    CleanModule,
    ShortcutModule,
    ThemeModule,
    FiletypeModule,
    ButtonModule,
    ToolModule,
    SearchPatternModule,
    SetupModule,
    DownloadModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService
  ]
})
export class AppModule {

  constructor() {
    const envBuf = Object
      .keys(process.env)
      .filter(k => k.startsWith('FNF_') && !k.includes('API_KEY'))
      .map((v, i, arr) => '    │  ' + (i < arr.length - 1 ? '├' : '└') + '── ' + v + ': ' + process.env[v]);

    Logger.log(`
    ├─ config      
    │  ├──  incompatiblePaths: ${config.incompatiblePaths}
    │  ├──  containerPaths   : ${config.containerPaths}
    │  ├──  startPath        : ${config.startPath}
    │  └──  dockerRoot       : ${config.dockerRoot}
    │  
    ├─ process.env    
${envBuf.join('\n')} 
    │
    └─ environment   
       ├──  production   : ${environment.production}
       ├──  version      : ${environment.version}
       ├──  commitHash   : ${environment.commitHash}
       ├──  frontendPort : ${environment.frontendPort}
       ├──  backendPort  : ${environment.backendPort}
       ├──  websocketPort: ${environment.websocketPort}
       │ 
       ├──  openaiApiUrl : ${environment.openaiApiUrl}
       ├──  openaiModel  : ${environment.openaiModel}
       │ 
       ├──  llamaApiUrl  : ${environment.llamaApiUrl}
       ├──  llamaModel   : ${environment.llamaModel}
       │ 
       └──  aiCompletionService: ${environment.aiCompletionService}   
    `);
  }

}
