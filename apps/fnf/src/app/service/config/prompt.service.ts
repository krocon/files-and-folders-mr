import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {PromptDataIf} from "@fnf-data";


@Injectable({
  providedIn: "root"
})
export class PromptService {

  private static readonly config = {
    apiUrl: "api/prompts"
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(PromptService.config, config);
  }

  getCustomNames(): Observable<string[]> {
    return this.httpClient.get<string[]>(`${PromptService.config.apiUrl}/customnames`);
  }

  getDefaultNames(): Observable<string[]> {
    return this.httpClient.get<string[]>(`${PromptService.config.apiUrl}/getdefaultnames`);
  }

  getPrompt(key: string): Observable<PromptDataIf> {
    return this.httpClient.get<PromptDataIf>(`${PromptService.config.apiUrl}/${key}`);
  }

  getDefaults(key: string): Observable<PromptDataIf> {
    return this.httpClient.get<PromptDataIf>(`${PromptService.config.apiUrl}/${key}/defaults`);
  }

  savePrompt(key: string, prompt: PromptDataIf): Observable<{ success: boolean; message: string }> {
    return this.httpClient.put<{ success: boolean; message: string }>(`${PromptService.config.apiUrl}/${key}`, prompt);
  }

  resetToDefaults(key: string): Observable<PromptDataIf> {
    return this.httpClient.post<PromptDataIf>(`${PromptService.config.apiUrl}/${key}/reset`, {});
  }

}