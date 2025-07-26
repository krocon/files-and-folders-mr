import {Module} from "@nestjs/common";
import {ServeStaticModule} from "@nestjs/serve-static";
import {ConfigModule as NestConfigModule} from "@nestjs/config";

import {join} from "path";

import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {SysinfoModule} from "./sysinfo/sysinfo.module";
import {DrivesModule} from "./drives/drives.module";
import {FileModule} from "./file-content/file.module";
import {FileActionModule} from "./file-action/file-action.module";
import {WalkModule} from "./walk/walk.module";
import {DirModule} from "./dir/dir.module";
import {CustomCssModule} from "./customcss/custom-css.module";
import {PathModule} from "./config/path/path.module";
import {FindModule} from "./find/find.module";
import {Config} from "@fnf/fnf-data";
import {FindFolderModule} from "./findfolder/find-folder.module";
import {ShellModule} from "./shell/shell.module";
import {VolumeModule} from "./volumes/volume.module";
import {CheckGlobModule} from "./checkglob/checkglob.module";
import {CleanModule} from "./clean/clean.module";
import {AiCompletionsModule} from "./ai/ai-completions.module";
import {ShortcutModule} from "./config/shortcut/shortcut.module";
import {ColorModule} from "./config/color/color.module";
import {FiletypeModule} from "./config/filetype/filetype.module";
import {ToolModule} from "./config/tool/tool.module";

const config = new Config(
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
    ColorModule,
    FiletypeModule,
    ToolModule
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService
  ]
})
export class AppModule {
}
