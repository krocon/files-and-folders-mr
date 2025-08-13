import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {FiletypeExtensionMapping} from "@fnf-data";

@Injectable({
  providedIn: "root"
})
export class ConfigFiletypesService {

  private static readonly config = {
    apiUrl: "api/filetypes"
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(ConfigFiletypesService.config, config);
  }

  apiUrlFiletypes(): Observable<FiletypeExtensionMapping> {
    return this.httpClient.get<FiletypeExtensionMapping>(ConfigFiletypesService.config.apiUrl);
  }

  getDefaults(): Observable<FiletypeExtensionMapping> {
    return this.httpClient.get<FiletypeExtensionMapping>(`${ConfigFiletypesService.config.apiUrl}/defaults`);
  }

  saveFiletypes(mapping: FiletypeExtensionMapping): Observable<{ success: boolean; message: string }> {
    return this.httpClient.put<{
      success: boolean;
      message: string
    }>(`${ConfigFiletypesService.config.apiUrl}`, mapping);
  }

  resetToDefaults(): Observable<FiletypeExtensionMapping> {
    return this.httpClient.post<FiletypeExtensionMapping>(`${ConfigFiletypesService.config.apiUrl}/reset`, {});
  }
}
