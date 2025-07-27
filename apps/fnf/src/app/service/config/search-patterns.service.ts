import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {FiletypeExtensionsIf} from "@fnf-data";


@Injectable({
  providedIn: "root"
})
export class SearchPatternsService {

  private static readonly config = {
    apiUrl: "api/searchpatterns"
  };

  constructor(private readonly httpClient: HttpClient) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(SearchPatternsService.config, config);
  }


  load(): Observable<FiletypeExtensionsIf[]> {
    return (this.httpClient.get<FiletypeExtensionsIf[]>(SearchPatternsService.config.apiUrl));
  }
}
