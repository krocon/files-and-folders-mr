import {Routes} from '@angular/router';

export const routes: Routes = [


  {
    path: "files",
    loadComponent: () =>
      import("./feature/main/file.component").then(m => m.FileComponent)
  },
  {
    path: "about",
    loadComponent: () =>
      import("./feature/about/about.component").then(m => m.AboutComponent)
  },
  {
    path: "shell",
    loadComponent: () =>
      import("./feature/shell/servershell.component").then(m => m.ServershellComponent)
  },
  {
    path: "**",
    redirectTo: "files"
  }

];
