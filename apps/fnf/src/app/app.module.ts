import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {FnfConfirmationDialogComponent} from './common/confirmationdialog/fnf-confirmation-dialog.component';

@NgModule({
  imports: [
    BrowserModule,
    AppComponent,
    FnfConfirmationDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {} 