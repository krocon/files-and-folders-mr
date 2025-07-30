import {NgModule} from '@angular/core';
import {TaskListComponent} from './task-list/task-list.component';
import {TaskButtonComponent} from './task-list/task-button.component';

@NgModule({
  imports: [
    TaskListComponent,
    TaskButtonComponent
  ],
  exports: [
    TaskListComponent,
    TaskButtonComponent
  ]
})
export class TaskModule {} 