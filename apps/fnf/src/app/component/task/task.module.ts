import {NgModule} from '@angular/core';
import {TaskList} from './task-list/task-list';
import {TaskButtonComponent} from './task-list/task-button.component';

@NgModule({
  imports: [
    TaskList,
    TaskButtonComponent
  ],
  exports: [
    TaskList,
    TaskButtonComponent
  ]
})
export class TaskModule {} 