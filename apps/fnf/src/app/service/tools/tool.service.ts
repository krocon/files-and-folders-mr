import {Injectable} from "@angular/core";
import {BrowserOsType, CmdIf, DirEventIf, FileItemIf} from "@fnf/fnf-data";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {PanelManagementService} from "../panel/panel-management-service";

@Injectable({
  providedIn: "root"
})
export class ToolService {

  private static readonly config = {
    loadUrl: "/assets/config/tool/",
    shellUrl: "/api/shell",
  };

  constructor(
    private readonly httpClient: HttpClient,
    private readonly pms: PanelManagementService,
  ) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(ToolService.config, config);
  }


  public fetchTools(f: BrowserOsType): Observable<CmdIf[] | undefined> {
    return this.httpClient
      .get<CmdIf[]>(ToolService.config.loadUrl + f + '.json');
  }

  prepareCmdAndExecute(
    cmd: CmdIf,
    currentDir: string,
    selectedOrFocussedDataForActivePanel: FileItemIf[]) {
    const cmds: CmdIf[] = [];
    for (let i = 0; i < selectedOrFocussedDataForActivePanel.length; i++) {
      const fileItem = selectedOrFocussedDataForActivePanel[i];
      const cmdClone = this.clone(cmd);
      cmdClone.para = cmdClone.para
        .replace(/\$file/g, fileItem.dir + '/' + fileItem.base)
        .replace(/\$dir/g, currentDir);
      cmds.push(cmdClone);
    }

    this.execute(cmds);
  }

  private execute(cmds: CmdIf[]) {
    // this.socket.emit('shell', cmds);
    this.httpClient
      .post<DirEventIf[]>(ToolService.config.shellUrl, cmds)
      .subscribe();
  }

  private clone<T>(o: T): T {
    return JSON.parse(JSON.stringify(o));
  }

}
