import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ShellCmdIf, ShellCmdResultIf} from "@fnf-data";
import {getChangedPort} from "../../../app.config";


@Injectable({
  providedIn: "root"
})
export class ShellService {


  private static readonly config = {
    shellUrl: "/api/shell"
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(
    config: { [key: string]: string },
    ports: number[]
  ) {
    Object.assign(ShellService.config, config);

    ShellService.config.shellUrl = getChangedPort(ShellService.config.shellUrl, ports, 2);
  }


  shell(data: ShellCmdIf[]): Observable<ShellCmdResultIf[]> {
    return this.httpClient
      .post<ShellCmdResultIf[]>(
        ShellService.config.shellUrl,
        data
      );
  }
}