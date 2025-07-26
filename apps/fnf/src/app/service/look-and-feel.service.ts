import {Inject, Injectable} from "@angular/core";
import {Observable, of} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {LookAndFeelData} from "../domain/look-and-feel.data";
import {DOCUMENT} from "@angular/common";
import {TypedDataService} from "../common/typed-data.service";
import {Socket} from "ngx-socket-io";
import {CssColors} from "@fnf-data";



@Injectable({
  providedIn: "root"
})
export class LookAndFeelService {

  private static readonly defaultTheme = "light";

  private static readonly innerService =
    new TypedDataService<string>("theme", LookAndFeelService.defaultTheme);

  private static readonly config = {
    getApiUrl: "/api/themes"
  };


  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly httpClient: HttpClient,
    private readonly socket: Socket
  ) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(LookAndFeelService.config, config);
  }

  async init() {
    const themeName = this.getTheme();
    if (themeName) {
      this.loadAndApplyLookAndFeel(themeName);
    }
    // wir lauschen auf css-Updates aus anderen Browser-Fenstern:
    this.socket
      .fromEvent<CssColors, string>("onCssUpdate")
      .subscribe(wd => {
        this.applyColors(wd);
      });
  }


  getTheme(): string {
    return LookAndFeelService.innerService.getValue();
  }

  loadAndApplyLookAndFeel(theme: string) {
    const htmlElement = this.document.documentElement;
    htmlElement.setAttribute("favs-theme", theme);
    this.document.body.className = ""; // clear all
    this.document.body.classList.add(theme); // add one

    const subscription = this.loadTheme(theme)
      .subscribe(laf => {
        // this.lookAndFeelData = laf;
        this.applyLookAndFeel(laf);
        subscription.unsubscribe();
        LookAndFeelService.innerService.update(theme);
      });
  }

  loadTheme(theme: string): Observable<LookAndFeelData> {
    const url = `${LookAndFeelService.config.getApiUrl}/${theme}`;
    return this.httpClient.get<LookAndFeelData>(url);
  }

  loadDefaultNames(): Observable<string[]> {
    const url = `${LookAndFeelService.config.getApiUrl}/getdefaultnames`;
    return this.httpClient.get<string[]>(url);
  }

  loadCustomNames(): Observable<string[]> {
    const url = `${LookAndFeelService.config.getApiUrl}/customnames`;
    return this.httpClient.get<string[]>(url);
  }

  emitColors(colors: CssColors) {
    this.socket.emit("updateCss", colors);
  }

  applyColors(colors: CssColors) {
    if (colors) {
      for (const key in colors) {
        const value = colors[key];
        document.documentElement.style.setProperty(key, value);
      }
    }
  }

  private applyLookAndFeel(laf: LookAndFeelData) {
    if (laf?.colors) {
      this.applyColors(laf?.colors);
      this.socket.emit("updateCss", laf?.colors);
      this.applyToMetaTag(laf);
    }
  }

  private applyToMetaTag(laf: LookAndFeelData) {
    // we set the color theme meta tag:
    [
      "theme-color",
      "msapplication-navbutton-color",
      "apple-mobile-web-app-status-bar-style"
    ].forEach(name =>
      document.querySelector("meta[name=" + name + "]")
        ?.setAttribute("content", laf.colors["var(--fnf-header-bg-color)"])
    );
  }

}
