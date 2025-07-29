import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {ShortcutComponent} from './shortcut/shortcut.component';
import {MatDivider} from '@angular/material/divider';
import {AppService} from "../../../../app.service";
import {ActionId} from "../../../../domain/action/fnf-action.enum";
import {MatBottomSheet, MatBottomSheetConfig} from "@angular/material/bottom-sheet";
import {TaskListComponent} from "../../../task/task-list/task-list.component";
import {ButtonEnableStates, ButtonEnableStatesKey, CmdIf} from "@fnf-data";
import {MatList} from "@angular/material/list";
import {TaskButtonComponent} from "../../../task/task-list/task-button.component";
import {FnfActionLabels} from "../../../../domain/action/fnf-action-labels";
import {takeWhile} from "rxjs/operators";
import {ActionExecutionService} from "../../../../service/action/action-execution.service";
import {LookAndFeelService} from "../../../../service/look-and-feel.service";
import {ConfigButtonsService} from "../../../../service/config/config-buttons.service";
import {ConfigThemesService} from "../../../../service/config/config-themes.service";

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
  styleUrls: ['./buttonpanel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonPanelComponent implements OnInit, OnDestroy {

  @Input() buttonEnableStates = new ButtonEnableStates();


  themeDefaultNames: string[] = [];
  themeCustomNames: string[] = [];

  buttons: { [key: string]: ButtonEnableStatesKey[] } = {};


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
    "COPY_2_CLIPBOARD_FULLNAMES",
    "COPY_2_CLIPBOARD_NAMES_AS_JSON",
    "COPY_2_CLIPBOARD_FULLNAMES_AS_JSON",
  ];


  menuItems1: ActionId[] = [
    "OPEN_COPY_DLG",
    "OPEN_MOVE_DLG",
    "OPEN_DELETE_DLG",
    "OPEN_MKDIR_DLG",
    "OPEN_RENAME_DLG",
    "OPEN_ATTRIBUTE_DLG",
    "OPEN_UNPACK_DLG",
    "OPEN_PACK_DLG",
    "OPEN_DOWNLOAD_DLG",
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

  // Current button list based on modifier keys
  currentButtons: ButtonEnableStatesKey[] = [];

  constructor(
    private readonly appService: AppService,
    private readonly matBottomSheet: MatBottomSheet,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly lookAndFeelService: LookAndFeelService,
    private readonly configThemesService: ConfigThemesService,
    private readonly configButtonsService: ConfigButtonsService,
    private readonly cdr: ChangeDetectorRef,
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
      .subscribe(() => this.init());

    this.configThemesService
      .loadDefaultNames()
      .pipe(
        takeWhile(() => this.alive)
      )
      .subscribe(arr => this.themeDefaultNames = arr);

    this.configThemesService
      .loadCustomNames()
      .pipe(
        takeWhile(() => this.alive)
      )
      .subscribe(arr => this.themeCustomNames = arr);

    this.configButtonsService
      .apiUrlButtons()
      .pipe(
        takeWhile(() => this.alive)
      )
      .subscribe(buttons => {
        this.buttons = buttons;
        this.currentButtons = this.buttons['default'];
        this.cdr.markForCheck();
      });
  }

  init() {
    this.tools = this.appService.getDefaultTools();
  }


  openButtonSheet() {
    const config = new MatBottomSheetConfig();
    config.panelClass = 'fnf-top-sheet';
    this.matBottomSheet.open(TaskListComponent, config);
  }


  closeButtonSheet() {
    this.matBottomSheet.dismiss();
  }

  onButtonClick(actionId: ActionId): void {
    this.actionExecutionService.executeActionById(actionId);
  }


  triggerAction(id: ActionId) {
    if (id === 'PRINT_DEBUG') {
      this.appService.debug();
      // although we respond to PRINT_DEBUG, we forward the ID
    }

    this.actionExecutionService.executeActionById(id);
  }

  setTheme(theme: string) {
    this.lookAndFeelService.loadAndApplyLookAndFeel(theme);
  }


  onToolClicked(tool: CmdIf) {
    this.actionExecutionService.executeCmd(tool);
  }

  getShortcutsByAction(action: ActionId) {
    return this.appService.getFirstShortcutByActionAsTokens(action);
  }

  getSimplestShortcutsByAction(action: ActionId) {
    return this.appService.getSimplestShortcutsByAction(action);
  }


  getShortcutAsLabelTokens(sc: string): string[] {
    return this.appService.getShortcutAsLabelTokens(sc);
  }

  getLabelByAction(action: ActionId): string {
    return FnfActionLabels.actionIdLabelMap[action] ?? action;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.updateButtonList(event);
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.updateButtonList(event);
  }

  private updateButtonList(event: KeyboardEvent): void {
    let newButtons: ButtonEnableStatesKey[];

    // Check modifier keys in priority order
    // if (event.ctrlKey) {
    //   newButtons = this.buttons['ctrl'];
    // } else
    if (event.metaKey) { // Command key on Mac
      newButtons = this.buttons['cmd'];
    } else if (event.altKey) {
      newButtons = this.buttons['alt'];
    } else if (event.shiftKey) {
      newButtons = this.buttons['shift'];
    } else {
      newButtons = this.buttons['default'];
    }

    // Only update and trigger change detection if the button list actually changed
    if (this.currentButtons !== newButtons) {
      this.currentButtons = newButtons;
      this.cdr.markForCheck();
    }
  }
}
