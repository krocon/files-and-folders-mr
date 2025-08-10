import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {ButtonEnableStatesKey} from "@fnf-data";

export type ButtonMapping = { [key: string]: ButtonEnableStatesKey[] };

@Injectable({
  providedIn: "root"
})
export class ConfigButtonsService {

  private static readonly config = {
    apiUrl: "api/buttons"
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(ConfigButtonsService.config, config);
  }

  apiUrlButtons(): Observable<ButtonMapping> {
    return this.httpClient.get<ButtonMapping>(ConfigButtonsService.config.apiUrl);
  }

  getDefaults(): Observable<ButtonMapping> {
    return this.httpClient.get<ButtonMapping>(`${ConfigButtonsService.config.apiUrl}/defaults`);
  }

  saveButtons(mapping: ButtonMapping): Observable<{ success: boolean; message: string }> {
    return this.httpClient.put<{ success: boolean; message: string }>(`${ConfigButtonsService.config.apiUrl}`, mapping);
  }

  resetToDefaults(): Observable<ButtonMapping> {
    return this.httpClient.post<ButtonMapping>(`${ConfigButtonsService.config.apiUrl}/reset`, {});
  }
}