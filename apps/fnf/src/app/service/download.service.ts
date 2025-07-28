import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {DownloadDialogResultData} from '@fnf-data';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  private static readonly config = {
    downloadUrl: '/api/download'
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(DownloadService.config, config);
  }

  /**
   * Download a single file or multiple files as an archive
   * @param data The download configuration data
   * @returns Observable that triggers the download
   */
  download(data: DownloadDialogResultData): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post(
      DownloadService.config.downloadUrl,
      data,
      {
        headers: headers,
        responseType: 'blob'
      }
    );
  }
} 