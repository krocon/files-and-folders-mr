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


}
