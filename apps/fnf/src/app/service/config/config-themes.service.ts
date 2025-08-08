import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {ColorDataIf} from "@fnf-data";


@Injectable({
  providedIn: "root"
})
export class ConfigThemesService {

  private static readonly config = {
    apiUrl: "/api/themes"
  };


  constructor(
    private readonly httpClient: HttpClient
  ) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(ConfigThemesService.config, config);
  }


  loadTheme(theme: string): Observable<ColorDataIf> {
    const url = `${ConfigThemesService.config.apiUrl}/${theme}`;
    return this.httpClient.get<ColorDataIf>(url);
  }

  loadDefaultNames(): Observable<string[]> {
    const url = `${ConfigThemesService.config.apiUrl}/getdefaultnames`;
    return this.httpClient.get<string[]>(url);
  }

  loadCustomNames(): Observable<string[]> {
    const url = `${ConfigThemesService.config.apiUrl}/customnames`;
    return this.httpClient.get<string[]>(url);
  }

  saveTheme(themeName: string, data: ColorDataIf): Observable<{ success: boolean; message: string }> {
    const url = `${ConfigThemesService.config.apiUrl}/${encodeURIComponent(themeName)}`;
    return this.httpClient.put<{ success: boolean; message: string }>(url, data);
  }

  deleteTheme(themeName: string): Observable<{ success: boolean; message: string }> {
    const url = `${ConfigThemesService.config.apiUrl}/${encodeURIComponent(themeName)}`;
    return this.httpClient.delete<{ success: boolean; message: string }>(url);
  }

}
