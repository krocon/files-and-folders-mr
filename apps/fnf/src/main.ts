import {bootstrapApplication} from '@angular/platform-browser';
import {getAppConfig} from './app/app.config';
import {AppComponent} from './app/app.component';


async function init() {
  bootstrapApplication(AppComponent, await getAppConfig())
    .catch((err) => console.error(err));
}

init();