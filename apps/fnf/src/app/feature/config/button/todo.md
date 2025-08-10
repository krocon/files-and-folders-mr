# new feature: edit dialog for button configuration

## Note these rules: .junie/instructions_angular.md

## create a new dialog analog to the layout of apps/fnf/src/app/feature/cmd/multirename/multi-rename-dialog.component.html

target folder: apps/fnf/src/app/feature/config/button

- title: "Edit Button Configuration"
- content: Edit json object. use FnfEditorComponent (monaco)
- Footer: 'Reset', spacer, 'Cancel', 'Save'

Save should be disabled, if editor content is not a valid json.

Use this controller for loading/saving: apps/fnf-api/src/app/config/button/button.controller.ts

Use a dialog.service and a ddialog.config ananlog to apps/fnf/src/app/feature/cmd/multirename

## Extend main menu

new item 'Button Configuration...', below 'Edit Themes...'