# new feature: edit dialog for file type configuration

## Note these rules: .junie/instructions_angular.md

Use new angular template syntax: no *ngIf no *ngFor (user @if and @for). No Signals!

## create a new dialog analog to  apps/fnf/src/app/feature/config/button

target folder: apps/fnf/src/app/feature/config/tiletype

- title: "Edit File Type Configuration"
- content: Edit json object. use FnfEditorComponent (monaco)
- Footer: 'Reset', spacer, 'Cancel', 'Save'

Save should be disabled, if editor content is not a valid json.

Use this controller for reset/loading/saving: apps/fnf-api/src/app/config/filetype/filetype.controller.ts

Use a dialog.service and a dialog.config ananlog to apps/fnf/src/app/feature/config/button

## Extend main menu

new item 'File Type Configuration...', below 'Button Configuration...'