import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SetupData} from '@fnf-data';

@Injectable({
  providedIn: 'root'
})
export class SetupPersistentService {

  private static readonly config = {
    baseUrl: '/api/setup'
  };

  constructor(private http: HttpClient) {
  }

  static forRoot(config: { [key: string]: string | boolean }) {
    Object.assign(SetupPersistentService.config, config);
  }

  getSetupData(): Observable<SetupData> {
    return this.http.get<SetupData>(`${SetupPersistentService.config.baseUrl}`);
  }

  getDefaultSetupData(): Observable<SetupData> {
    return this.http.get<SetupData>(`${SetupPersistentService.config.baseUrl}/defaults`);
  }

  saveSetupData(setupData: SetupData): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${SetupPersistentService.config.baseUrl}`, setupData);
  }

  resetToDefaults(): Observable<SetupData> {
    return this.http.post<SetupData>(`${SetupPersistentService.config.baseUrl}/reset`, {});
  }
}