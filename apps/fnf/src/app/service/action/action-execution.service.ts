import {Injectable} from "@angular/core";
import {ActionId} from "../../domain/action/fnf-action.enum";
import {PanelManagementService} from "../panel/panel-management-service";
import {ChangeDirDialogService} from "../../component/cmd/changedir/change-dir-dialog.service";
import {ShellLocalStorage} from "../../component/main/footer/shellpanel/shell-local-storage";
import {CleanDialogData, CmdIf, DOT_DOT, FileItemIf, FindData, FindDialogData, PanelIndex} from "@fnf-data";
import {FileTableBodyModel} from "../../component/main/filetable/file-table-body-model";
import {SelectionManagerForObjectModels} from "../../component/main/filetable/selection-manager";
import {ClipboardService} from "../clipboard-service";
import {Router} from "@angular/router";
import {RenameDialogData} from "../../component/cmd/rename/rename-dialog.data";
import {RenameDialogResultData} from "../../component/cmd/rename/rename-dialog-result.data";
import {QueueFileOperationParams} from "../../domain/cmd/queue-file-operation-params";
import {MultiRenameDialogData} from "../../component/cmd/multirename/data/multi-rename-dialog.data";
import {QueueActionEvent} from "../../domain/cmd/queue-action-event";
import {GroupFilesDialogData} from "../../component/cmd/groupfiles/data/group-files-dialog.data";
import {MultiRenameDialogService} from "../../component/cmd/multirename/multi-rename-dialog.service";
import {MultiMkdirDialogService} from "../../component/cmd/multimkdir/multi-mkdir-dialog.service";
import {GroupFilesDialogService} from "../../component/cmd/groupfiles/group-files-dialog.service";
import {RenameDialogService} from "../../component/cmd/rename/rename-dialog.service";
import {CommandService} from "../cmd/command.service";
import {ChangeDirDialogData} from "../../component/cmd/changedir/data/change-dir-dialog.data";
import {ChangeDirEvent} from "../change-dir-event";
import {ChangeDirEventService} from "../change-dir-event.service";
import {TabData} from "../../domain/filepagedata/data/tab.data";
import {CleanDialogService} from "../../component/cmd/clean/clean-dialog.service";
import {FindDialogService} from "../../component/cmd/find/find-dialog.service";
import {ShortcutDialogService} from "../../component/shortcut/shortcut-dialog.service";
import {ToolService} from "../config/tool.service";
import {FindSocketService} from "../find.socketio.service";
import {CopyOrMoveOrDeleteDialogData} from "../../component/cmd/copyormoveordelete/copy-or-move-or-delete-dialog.data";
import {
  CopyOrMoveOrDeleteDialogService
} from "../../component/cmd/copyormoveordelete/copy-or-move-or-delete-dialog.service";
import {TabsPanelData} from "../../domain/filepagedata/data/tabs-panel.data";
import {SelectionDialogData} from "../../component/cmd/selection/selection-dialog.data";
import {SelectionDialogService} from "../../component/cmd/selection/selection-dialog.service";
import {Subject} from "rxjs";
import {UnzipDialogResultData} from "../../component/cmd/unzip/unzip-dialog-result.data";

@Injectable({
  providedIn: 'root'
})
export class ActionExecutionService {

  public static defaultTools: CmdIf[] = [];
  public readonly actionEvents$ = new Subject<ActionId>();
  private bodyAreaModels: [FileTableBodyModel | undefined, FileTableBodyModel | undefined] = [undefined, undefined];
  private selectionManagers: [SelectionManagerForObjectModels<FileItemIf> | undefined, SelectionManagerForObjectModels<FileItemIf> | undefined] = [undefined, undefined];


  constructor(
    private readonly pms: PanelManagementService,
    private readonly changeDirDialogService: ChangeDirDialogService,
    private readonly shellLocalStorage: ShellLocalStorage,
    private readonly clipboardService: ClipboardService,
    private readonly multiRenameDialogService: MultiRenameDialogService,
    private readonly multiMkdirDialogService: MultiMkdirDialogService,
    private readonly groupFilesDialogService: GroupFilesDialogService,
    private readonly renameDialogService: RenameDialogService,
    private readonly commandService: CommandService,
    private readonly changeDirEventService: ChangeDirEventService,
    private readonly cleanDialogService: CleanDialogService,
    private readonly findDialogService: FindDialogService,
    private readonly shortcutDialogService: ShortcutDialogService,
    private readonly toolService: ToolService,
    private readonly findSocketService: FindSocketService,
    private readonly copyOrMoveDialogService: CopyOrMoveOrDeleteDialogService,
    private readonly deleteDialogService: CopyOrMoveOrDeleteDialogService,
    private readonly selectionDialogService: SelectionDialogService,
    private readonly router: Router,
  ) {

  }


  executeActionById(id: ActionId) {
    console.log('AES> executeActionById:', id);
    const panelIndex = this.pms.getActivePanelIndex();
    const tabsPanelData = this.pms.getTabsPanelData(panelIndex);

    if (id === 'TOGGLE_PANEL') {
      this.pms.togglePanelSelection();

    } else if (id === 'NEXT_TAB') {
      tabsPanelData.selectedTabIndex = (tabsPanelData.selectedTabIndex + 1) % tabsPanelData.tabs.length;
      this.pms.updateTabsPanelData(panelIndex, tabsPanelData);

    } else if (id === 'TOGGLE_FILTER') {
      const tab = tabsPanelData.tabs[tabsPanelData.selectedTabIndex];
      tab.filterActive = !tab.filterActive;
      this.pms.updateTabsPanelData(panelIndex, tabsPanelData);

    } else if (id === 'TOGGLE_SHELL') {
      this.shellLocalStorage.toggleShellVisible();

    } else if (id === 'TOGGLE_HIDDEN_FILES') {
      const tab = tabsPanelData.tabs[tabsPanelData.selectedTabIndex];
      tab.hiddenFilesVisible = !tab.hiddenFilesVisible;
      this.pms.updateTabsPanelData(panelIndex, tabsPanelData);

    } else if (id === 'REMOVE_TAB') {
      this.pms.removeTab();

    } else if (id === 'ADD_NEW_TAB') {
      this.pms.addNewTab();

    } else if (id === 'SELECT_LEFT_PANEL') {
      this.pms.setPanelActive(0);

    } else if (id === 'SELECT_RIGHT_PANEL') {
      this.pms.setPanelActive(1);

    } else if (id === "COPY_2_CLIPBOARD_FULLNAMES") {
      const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
      this.clipboardService.copyFullNames(rows);

    } else if (id === "COPY_2_CLIPBOARD_NAMES") {
      const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
      this.clipboardService.copyNames(rows);

    } else if (id === "COPY_2_CLIPBOARD_FULLNAMES_AS_JSON") {
      const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
      this.clipboardService.copyFullNamesAsJson(rows);

    } else if (id === "COPY_2_CLIPBOARD_NAMES_AS_JSON") {
      const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
      this.clipboardService.copyNamesAsJson(rows);

    } else if (id === "OPEN_ABOUT_DLG") {
      this.router.navigate(['/about']);

    } else if (id === "OPEN_SETUP_DLG") {
      this.router.navigate(['/setup']);

    } else if (id === "OPEN_SHELL_DLG") {
      this.router.navigate(['/shell']);

    } else if (id === "OPEN_RENAME_DLG") {
      this.rename();

    } else if (id === "OPEN_MULTIRENAME_DLG") {
      this.multiRename();

    } else if (id === "OPEN_MULTIMKDIR_DLG") {
      this.multiMkdir();

    } else if (id === "OPEN_GROUPFILES_DLG") {
      this.groupFiles();

    } else if (id === "OPEN_CHDIR_DLG") {
      this.openChangeDirDialog();

    } else if (id === "OPEN_FIND_DLG") {
      this.openFindDialog(null);

    } else if (id === "OPEN_DELETE_EMPTY_FOLDERS_DLG") {
      this.openCleanDialog(null);

    } else if (id === "OPEN_DELETE_DLG") {
      this.openDeleteDialog();

    } else if (id === "OPEN_SHORTCUT_DLG") {
      this.shortcutDialogService.open();

    } else if (id === "OPEN_VIEW_DLG") {
      this.onViewClicked();

    } else if (id === "OPEN_EDIT_DLG") {
      this.onEditClicked();

    } else if (id === "OPEN_COPY_DLG") {
      this.openCopyDlg();

    } else if (id === "OPEN_MOVE_DLG") {
      this.openMoveDlg();

    } else {
      for (const tool of ActionExecutionService.defaultTools) {
        if (tool.id === id) {
          this.executeCmd(tool);
          return;
        }
      }
      // Not executed, so emit id to listeners:
      this.actionEvents$.next(id);
    }
  }

  setBodyAreaModel(panelIndex: PanelIndex, m: FileTableBodyModel) {
    this.bodyAreaModels[panelIndex] = m;
  }

  setSelectionManagers(panelIndex: PanelIndex, m: SelectionManagerForObjectModels<FileItemIf>) {
    this.selectionManagers[panelIndex] = m;
  }

  debug() {
    console.log('> this.selectionManagers:', this.selectionManagers);
    this.bodyAreaModels.forEach((bodyAreaModel, i) => {
      if (bodyAreaModel) {
        console.info('bodyAreaModel(' + i + ') focusedRowIndex:', bodyAreaModel.getFocusedRowIndex());
        console.info('bodyAreaModel(' + i + ') row count', bodyAreaModel.getRowCount());
        console.info('bodyAreaModel(' + i + ') rows:', bodyAreaModel.getAllRows());
      }
    });
  }

  openFileItem(fileItem?: FileItemIf) {
    const srcPanelIndex = this.pms.getActivePanelIndex();
    if (!fileItem) {
      const rows = this.getSelectedOrFocussedData(srcPanelIndex);
      if (rows?.length === 1) {
        fileItem = rows[0];
      }
    }
    if (fileItem) {
      const actionEvent = this.commandService.createQueueActionEventForOpen(
        new QueueFileOperationParams(fileItem, srcPanelIndex, fileItem, srcPanelIndex)
      );
      this.commandService.addActions([actionEvent]);
    }
  }

  executeCmd(cmd: CmdIf) {
    const currentDir = this.pms.getActiveTabOnActivePanel().path;
    const fileItems: FileItemIf[] = this.getSelectedOrFocussedDataForActivePanel();

    this.toolService.prepareCmdAndExecute(cmd, currentDir, fileItems);
  }

  callActionMkDir(para: { dir: string; base: string; panelIndex: PanelIndex }) {
    const actionEvent = this.commandService.createQueueActionEventForMkdir(para);
    this.commandService.addActions([actionEvent]);
  }

  callActionCreateFile(para: { dir: string; base: string; ext: string; panelIndex: PanelIndex }) {
    const actionEvent = this.commandService.createQueueActionEventForCreateFile(para);
    this.commandService.addActions([actionEvent]);
  }

  /**
   * Wird auch vom appService mit parameter aufgerufen
   * @param data
   */
  openFindDialog(
    data: FindDialogData | null
  ) {
    const panelIndex = this.pms.getActivePanelIndex();
    if (!data) {
      data = new FindDialogData('', '**/*.*', true, false);
      data.folders = this.getRelevantDirsFromActiveTab();
    }
    this.findDialogService
      .open(data, (result: FindDialogData | undefined) => {
        if (result) {
          if (result.folder) {
            result.folders = result.folder.split(',');
            result.folder = '';
          }
          const findData: FindData = this.findSocketService.createFindData(result);

          if (findData.findDialogData.newtab) {
            const tabDataFindings = new TabData(findData.dirTabKey);
            tabDataFindings.findData = findData;
            this.pms.addTab(panelIndex, tabDataFindings);

          } else {
            const tabsPanel = this.pms.getTabsPanelData(panelIndex);
            const tabData = tabsPanel.tabs[tabsPanel.selectedTabIndex];
            tabData.path = findData.dirTabKey;
            tabData.findData = findData;
            this.pms.updateTabsPanelData(panelIndex, this.pms.getTabsPanelData(panelIndex));
          }
        }
      });
  }

  openSelectionDialog(
    panelIndex: PanelIndex,
    enhance: boolean,
    cb: (data: string | undefined, enhance: boolean) => void) {

    console.info('AES openSelectionDialog', enhance);

    const rows = this.getSelectedOrFocussedData(panelIndex);
    const s = rows.length ? rows[0].ext : '';
    this.selectionDialogService.open(
      new SelectionDialogData(s, enhance),
      (data) => cb(data, enhance));
  }

  callActionUnzip(para: UnzipDialogResultData) {
    const actionEvent = this.commandService.createQueueActionEventForUnzip(para);
    //const refreshes:QueueActionEvent[] = this.commandService.createRefreshesActionEvents([0,1]);
    this.commandService.addActions([
      actionEvent,
      // ...refreshes
    ]);
  }

  callActionPack(para: any) {
    const actionEvent = this.commandService.createQueueActionEventForPack(para);
    this.commandService.addActions([
      actionEvent,
    ]);
  }

  private openCopyDlg() {
    const selectedData: FileItemIf[] = this.getSelectedOrFocussedDataForActivePanel();
    const sources: string[] = this.getSourcePaths(selectedData);
    this.copyOrMoveDialogService
      .open(
        new CopyOrMoveOrDeleteDialogData(sources, this.pms.getOtherPanelSelectedTabData().path, "copy"),
        (target) => {
          if (target) {
            const paras: QueueFileOperationParams[] = this.createFileOperationParams(target);
            const actionEvents = paras.map(item => this.commandService.createQueueActionEventForCopy(item));
            this.commandService.addActions(actionEvents);
          }
        }
      );
  }

  private openMoveDlg() {
    const selectedData: FileItemIf[] = this.getSelectedOrFocussedDataForActivePanel();
    const sources: string[] = this.getSourcePaths(selectedData);
    const targetDir = this.pms.getOtherPanelSelectedTabData().path;
    this.copyOrMoveDialogService
      .open(
        new CopyOrMoveOrDeleteDialogData(sources, targetDir, "move"),
        (target) => {
          if (target) {
            const paras: QueueFileOperationParams[] = this.createFileOperationParams(target);
            const actionEvents = paras.map(item => this.commandService.createQueueActionEventForMove(item));
            this.commandService.addActions(actionEvents);
          }
        }
      );
  }

  private onEditClicked() {
    const selectedData: FileItemIf[] = this.getSelectedOrFocussedDataForActivePanel();
    if (selectedData.length === 1) {
      localStorage.setItem('edit-selected-data', JSON.stringify(selectedData[0]));
      localStorage.setItem('edit-readonly', 'false');
      const strWindowFeatures = "location=no,height=600,width=800,scrollbars=yes,status=yes";
      const url = location.origin + "/edit.html";
      window.open(url, "_blank", strWindowFeatures);
    }
  }

  private onViewClicked() {
    const selectedData: FileItemIf[] = this.getSelectedOrFocussedDataForActivePanel();
    if (selectedData.length === 1) {
      localStorage.setItem('edit-selected-data', JSON.stringify(selectedData[0]));
      localStorage.setItem('edit-readonly', 'true');
      const strWindowFeatures = "location=no,height=600,width=800,scrollbars=yes,status=yes";
      const url = location.origin + "/edit.html";
      window.open(url, "_blank", strWindowFeatures);
    }
  }

  private openCleanDialog(data: CleanDialogData | null) {
    if (!data) {
      data = new CleanDialogData('', '**/*.bak', true);
      data.folders = this.getRelevantDirsFromActiveTab();
    }
    this.cleanDialogService.open(
      data,
      (result: CleanDialogData | undefined) => {
        // TODO xxxx marc this.actionEvents$.next('RELOAD_DIR');
      });
  }

  private openChangeDirDialog() {
    this.changeDirDialogService
      .open(
        new ChangeDirDialogData(
          this.pms.getActiveTabOnActivePanel().path,
          this.pms.getActivePanelIndex()
        ),
        (result: ChangeDirEvent | undefined) => {
          if (result) {
            this.changeDirEventService.next(result);
          }
        });
  }

  private getSelectedOrFocussedData(panelIndex: PanelIndex): FileItemIf[] {
    let ret = this.selectionManagers[panelIndex]?.getSelectedRows() ?? [];
    if (!ret?.length && this.bodyAreaModels[panelIndex]) {
      const focusedRowIndex = this.bodyAreaModels[panelIndex]?.getFocusedRowIndex() ?? 0;
      const frd = this.bodyAreaModels[panelIndex]?.getRowByIndex(focusedRowIndex) ?? null;
      if (frd) {
        ret = [frd];
      } else {
        ret = [];
      }
    }
    return ret ?? [];
  }

  private getRelevantDirsFromActiveTab(): string[] {
    let fileItems = this.getSelectedDataForActivePanel().filter(fi => fi.isDir);
    if (fileItems.length === 1 && fileItems[0].base === DOT_DOT) {
      fileItems = [];
    }
    if (fileItems.length) {
      return fileItems.map(fi => `${fi.dir}/${fi.base}`);
    }
    return [this.pms.getActiveTabOnActivePanel().path];
  }

  private getSelectedDataForActivePanel(): FileItemIf[] {
    return this.getSelectedData(this.pms.getActivePanelIndex());
  }

  private getSelectedOrFocussedDataForActivePanel(): FileItemIf[] {
    return this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
  }

  private getSelectedData(panelIndex: PanelIndex): FileItemIf[] {
    return this.selectionManagers[panelIndex]?.getSelectedRows() ?? [];
  }

  private removeTab() {
    this.pms.removeTab();
  }

  private addNewTab() {
    this.pms.addNewTab();
  }

  private rename() {
    const srcPanelIndex = this.pms.getActivePanelIndex();
    const rows = this.getSelectedOrFocussedData(srcPanelIndex);

    if (rows?.length === 1) {
      const source = rows[0];
      if (source.base === DOT_DOT) return // skip it
      const data = new RenameDialogData(source);
      this.renameDialogService
        .open(data, (result: RenameDialogResultData | undefined) => {
          if (result) {
            const actionEvent = this.commandService.createQueueActionEventForRename(
              new QueueFileOperationParams(result.source, srcPanelIndex, result.target, srcPanelIndex)
            );
            this.commandService.addActions([actionEvent]);
          }
        });
    }
  }

  private multiRename() {
    const srcPanelIndex = this.pms.getActivePanelIndex();
    const rows = this.getSelectedOrFocussedData(srcPanelIndex).filter(item => item.base !== DOT_DOT);

    if (rows?.length) {
      const data = new MultiRenameDialogData(rows, srcPanelIndex);
      //data.data =
      this.multiRenameDialogService
        .open(data, (arr: QueueActionEvent[] | undefined) => {
          if (arr) {
            this.commandService.addActions(arr);
          }
        });
    }
  }

  private multiMkdir() {
    const panelIndex = this.pms.getActivePanelIndex();
    const activeTabData = this.pms.getActiveTabOnActivePanel();
    const dir = activeTabData.path;

    this.multiMkdirDialogService
      .openDialog(
        dir,
        "S[C]",
        (dirNames: string[] | undefined) => {
          if (dirNames) {
            for (const base of dirNames) {
              this.callActionMkDir({
                dir,
                base,
                panelIndex
              });
            }
          }
          let id = ('RELOAD_DIR_' + panelIndex) as ActionId;
          this.executeActionById(id);
        }
      );
  }

  private groupFiles() {
    const srcPanelIndex = this.pms.getActivePanelIndex();
    const targetPanelIndex = this.pms.getInactivePanelIndex();
    const sourceTabData = this.pms.getActiveTabOnActivePanel();
    const targetTabData = this.pms.getOtherPanelSelectedTabData();
    const rows = this.getSelectedOrFocussedData(srcPanelIndex)
      .filter(item => item.base !== DOT_DOT);
    // .filter(item => !item.isDir);

    if (rows?.length) {
      const data = new GroupFilesDialogData(
        rows,
        sourceTabData.path,
        srcPanelIndex,
        targetTabData.path,
        targetPanelIndex
      );
      this.groupFilesDialogService
        .open(data, (arr: QueueActionEvent[] | undefined) => {
          if (arr) {
            this.commandService.addActions(arr);
          }
        });
    }
  }

  private clone<T>(o: T): T {
    return JSON.parse(JSON.stringify(o));
  }

  private openDeleteDialog() {
    const selectedData: FileItemIf[] = this.getSelectedOrFocussedDataForActivePanel();
    const sources: string[] = this.getSourcePaths(selectedData);

    this.copyOrMoveDialogService
      .open(
        new CopyOrMoveOrDeleteDialogData(sources, "", "delete"),
        (target) => {
          if (target) {
            const paras: QueueFileOperationParams[] = this.createFileOperationParams(target);
            const actionEvents = paras.map(item => this.commandService.createQueueActionEventForDel(item));
            const panelIndex = this.pms.getActivePanelIndex();
            const bodyAreaModel = this.bodyAreaModels[panelIndex];
            if (bodyAreaModel?.getFocusedRowIndex()) {
              bodyAreaModel.setFocusedRowIndex(Math.max(0, bodyAreaModel?.getFocusedRowIndex() - selectedData.length + 1));
            }
            this.commandService.addActions(actionEvents);
          }
        }
      );
  }

  private getSourcePaths(selectedData: FileItemIf[]): string[] {
    if (selectedData.length) {
      return selectedData.map(f => {
        return f.dir + "/" + f.base;
      });
    }
    const panelIndex = this.pms.getActivePanelIndex();
    const panelData: TabsPanelData = this.pms.getTabsPanelData(panelIndex);
    const activeTab = panelData.tabs[panelData.selectedTabIndex];
    return [activeTab.path];
  }

  private createFileOperationParams(target: FileItemIf): QueueFileOperationParams[] {
    const selectedData = this.getSelectedOrFocussedDataForActivePanel();
    const srcPanelIndex = this.pms.getActivePanelIndex();
    const targetPanelIndex = this.pms.getInactivePanelIndex();
    return selectedData.map(item =>
      new QueueFileOperationParams(item, srcPanelIndex, target, targetPanelIndex, selectedData.length > 1)
    );
  }
}