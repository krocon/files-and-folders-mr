import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {ShortcutComponent} from './shortcut/shortcut.component';
import {MatDivider} from '@angular/material/divider';
import {cssThemes, Theme} from '../../../../domain/customcss/css-theme-type';
import {AppService} from "../../../../app.service";
import {ActionId} from "../../../../domain/action/fnf-action.enum";
import {MatBottomSheet, MatBottomSheetConfig} from "@angular/material/bottom-sheet";
import {TaskList} from "../../../task/task-list/task-list";
import {ButtonEnableStates, buttonEnableStatesKey, CmdIf} from "@fnf/fnf-data";
import {MatList} from "@angular/material/list";
import {TaskButtonComponent} from "../../../task/task-list/task-button.component";
import {FnfActionLabels} from "../../../../domain/action/fnf-action-labels";
import {takeWhile} from "rxjs/operators";
import {ActionExecutionService} from "../../../../service/action/action-execution.service";

@Component({
  selector: 'app-button-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuTrigger,
    MatMenu,
    ShortcutComponent,
    MatMenuItem,
    MatDivider,
    MatList,
    TaskButtonComponent,

  ],
  templateUrl: './buttonpanel.component.html',
  styleUrls: ['./buttonpanel.component.css']
})
export class ButtonPanelComponent implements OnInit, OnDestroy {

  @Input() buttonEnableStates = new ButtonEnableStates();

  themes = cssThemes;

  // TODO merge to actionIds and config of shortcuts! apps/fnf/src/assets/config/shortcut/osx.json
  readonly buttons: { label: string, shortcut?: string, icon?: string, action: buttonEnableStatesKey }[] = [
    {
      label: 'Copy',
      icon: '',
      action: 'OPEN_COPY_DLG',
      shortcut: 'F3'
    },
    {
      label: 'View',
      icon: '',
      action: 'OPEN_VIEW_DLG',
      shortcut: '⇧ F4'
    },
    {
      label: 'Edit',
      icon: '',
      action: 'OPEN_EDIT_DLG',
      shortcut: 'F4'
    },
    {
      label: 'Move',
      icon: '',
      action: 'OPEN_MOVE_DLG',
      shortcut: 'F6'
    },
    {
      label: 'Create Dir',
      icon: '',
      action: 'OPEN_MKDIR_DLG',
      shortcut: 'F7'
    },
    {
      label: 'Delete',
      icon: '',
      action: 'OPEN_DELETE_DLG',
      shortcut: 'F8'
    }
  ];


  menuItems0: ActionId[] = [
    'OPEN_GOTO_ANYTHING_DLG',
    '-',
    'RELOAD_DIR',
    'OPEN_FIND_DLG',
    'OPEN_CHDIR_DLG',
    'TOGGLE_FILTER',
    'TOGGLE_HIDDEN_FILES',
    'TOGGLE_SHELL',
    "-",
    "COPY_2_CLIPBOARD_NAMES",
    "COPY_2_CLIPBOARD_NAMES_AS_JSON",
    "COPY_2_CLIPBOARD_FULLNAMES",
    "COPY_2_CLIPBOARD_FULLNAMES_AS_JSON",
  ];


  menuItems1: ActionId[] = [
    "OPEN_COPY_DLG",
    "OPEN_MOVE_DLG",
    "OPEN_DELETE_DLG",
    "OPEN_MKDIR_DLG",
    "OPEN_RENAME_DLG",
    "-",
    "OPEN_MULTIRENAME_DLG",
    "OPEN_MULTIMKDIR_DLG",
    "OPEN_GROUPFILES_DLG",
    "OPEN_DELETE_EMPTY_FOLDERS_DLG",
  ];

  menuItems2: ActionId[] = [
    "ENHANCE_SELECTION",
    "REDUCE_SELECTION",
    "TOGGLE_SELECTION",
    "SELECT_ALL",
    "DESELECT_ALL",
    "-",
    "NAVIGATE_LEVEL_DOWN",
    "NAVIGATE_BACK",
    // 'NAVIGATE_FORWARD',
    "-",
    "SELECT_LEFT_PANEL",
    "SELECT_RIGHT_PANEL",
    "TOGGLE_PANEL",
    "-",
    'ADD_NEW_TAB',
    'REMOVE_TAB'
  ];


  menuItems3: ActionId[] = [
    "OPEN_SETUP_DLG",
    "OPEN_SHELL_DLG",
    "OPEN_ABOUT_DLG",
  ];


  tools: CmdIf[] = [];
  private alive = true;

  constructor(
    private readonly appService: AppService,
    private readonly matBottomSheet: MatBottomSheet,
    private readonly actionExecutionService: ActionExecutionService,
  ) {
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  ngOnInit(): void {
    this.alive = true;

    this.appService
      .init$
      .pipe(
        takeWhile(() => this.alive)
      )
      .subscribe(() => this.init())
  }

  init() {
    this.tools = this.appService.getDefaultTools();
  }


  openButtonSheet() {
    const config = new MatBottomSheetConfig();
    config.panelClass = 'fnf-top-sheet';
    this.matBottomSheet.open(TaskList, config);
  }


  closeButtonSheet() {
    this.matBottomSheet.dismiss();
  }

  onButtonClick(actionId: ActionId): void {
    this.actionExecutionService.executeActionById(actionId);
    // if (action === 'copy') {
    //   this.actionExecutionService.executeActionById('OPEN_COPY_DLG');
    //
    // } else if (action === 'edit') {
    //   this.actionExecutionService.executeActionById('OPEN_EDIT_DLG');
    //
    // } else if (action === 'view') {
    //   this.actionExecutionService.executeActionById('OPEN_VIEW_DLG');
    //
    // } else if (action === 'move') {
    //   this.actionExecutionService.executeActionById('OPEN_MOVE_DLG');
    //
    // } else if (action === 'mkdir') {
    //   this.actionExecutionService.executeActionById('OPEN_MKDIR_DLG');
    //
    // } else if (action === 'remove') {
    //   this.actionExecutionService.executeActionById('OPEN_DELETE_DLG');
    // }
  }


  triggerAction(id: ActionId) {
    if (id === 'PRINT_DEBUG') {
      this.appService.debug();
      // although we respond to PRINT_DEBUG, we forward the ID
    }

    this.actionExecutionService.executeActionById(id);
  }

  setTheme(theme: Theme) {
    this.appService.setTheme(theme);
  }


  onToolClicked(tool: CmdIf) {
    this.actionExecutionService.executeCmd(tool);
  }

  getShortcutsByAction(action: ActionId) {
    return this.appService.getFirstShortcutByActionAsTokens(action);
  }


  getShortcutAsLabelTokens(sc: string): string[] {
    return this.appService.getShortcutAsLabelTokens(sc);
  }

  getLabelByAction(action: ActionId): string {
    return FnfActionLabels.actionIdLabelMap[action] ?? action;
  }
}
