import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {BrowserOsType, ToolData} from "@fnf-data";

@Injectable({
  providedIn: "root"
})
export class ConfigToolsService {

  private static readonly config = {
    apiUrl: "api/tools"
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(ConfigToolsService.config, config);
  }

  getTools(os: BrowserOsType): Observable<ToolData> {
    return this.httpClient.get<ToolData>(`${ConfigToolsService.config.apiUrl}/${os}`);
  }

  getDefaults(os: BrowserOsType): Observable<ToolData> {
    return this.httpClient.get<ToolData>(`${ConfigToolsService.config.apiUrl}/${os}/defaults`);
  }

  saveTools(os: BrowserOsType, tools: ToolData): Observable<{ success: boolean; message: string }> {
    return this.httpClient.put<{
      success: boolean;
      message: string
    }>(`${ConfigToolsService.config.apiUrl}/${os}`, tools);
  }

  resetToDefaults(os: BrowserOsType): Observable<ToolData> {
    return this.httpClient.post<ToolData>(`${ConfigToolsService.config.apiUrl}/${os}/reset`, {});
  }
}
