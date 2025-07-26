import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";


@Injectable({
  providedIn: "root"
})
export class EditService {


  private static readonly config = {
    apiUrl: "/api/file?name=",
    saveFile: "/api/file?name="
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(EditService.config, config);
  }


  loadFile(name: string): Observable<string> {
    return this.httpClient.get(EditService.config.apiUrl + name, {responseType: 'text'});
  }

  saveFile(name: string, text: string): Observable<any> {
    return this.httpClient.post(EditService.config.apiUrl + name, text);
  }
}
