import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SetupData} from '@fnf-data';

@Injectable({
  providedIn: 'root'
})
export class SetupPersistentService {

  private static readonly config = {
    apiUrl: '/api/setup'
  };

  constructor(private http: HttpClient) {
  }

  static forRoot(config: { [key: string]: string | boolean }) {
    Object.assign(SetupPersistentService.config, config);
  }

  getSetupData(): Observable<SetupData> {
    return this.http.get<SetupData>(SetupPersistentService.config.apiUrl);
  }

  getDefaultSetupData(): Observable<SetupData> {
    const apiUrl = SetupPersistentService.config.apiUrl;
    return this.http.get<SetupData>(`${apiUrl}/defaults`);
  }

  saveSetupData(setupData: SetupData): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(SetupPersistentService.config.apiUrl, setupData);
  }

  resetToDefaults(): Observable<SetupData> {
    const apiUrl = SetupPersistentService.config.apiUrl;
    return this.http.post<SetupData>(`${apiUrl}/reset`, {});
  }
}