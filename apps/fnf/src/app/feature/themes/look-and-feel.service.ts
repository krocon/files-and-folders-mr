import {Inject, Injectable} from "@angular/core";
import {DOCUMENT} from "@angular/common";
import {TypedDataService} from "../../common/typed-data.service";
import {Socket} from "ngx-socket-io";
import {ColorDataIf, CssColors} from "@fnf-data";
import {ConfigThemesService} from "../../service/config/config-themes.service";


@Injectable({
  providedIn: "root"
})
export class LookAndFeelService {

  private static readonly defaultTheme = "light";

  private static readonly innerService =
    new TypedDataService<string>("theme", LookAndFeelService.defaultTheme);


  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly configThemesService: ConfigThemesService,
    private readonly socket: Socket
  ) {
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
        console.info('onCssUpdate', wd);
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

    const subscription = this.configThemesService.loadTheme(theme)
      .subscribe(laf => {
        // this.lookAndFeelData = laf;
        this.applyLookAndFeel(laf);
        subscription.unsubscribe();
        LookAndFeelService.innerService.update(theme);
      });
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

  private applyLookAndFeel(laf: ColorDataIf) {
    if (laf?.colors) {
      this.applyColors(laf?.colors);
      this.socket.emit("updateCss", laf?.colors);
      this.applyToMetaTag(laf);
    }
  }

  private applyToMetaTag(laf: ColorDataIf) {
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
