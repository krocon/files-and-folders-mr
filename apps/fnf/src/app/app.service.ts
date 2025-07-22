import {Injectable, Output} from "@angular/core";
import {LookAndFeelService} from "./service/look-and-feel.service";
import {ShortcutActionMapping, ShortcutService} from "./service/shortcut.service";
import {SysinfoService} from "./service/sysinfo.service";
import {ConfigService} from "./service/config.service";
import {FileSystemService} from "./service/file-system.service";
import {
  AllinfoIf,
  BrowserOsType,
  CmdIf,
  Config,
  DirEventIf,
  DirPara,
  DOT_DOT,
  FileItemIf,
  FindData,
  FindDialogData,
  isZipUrl,
  PanelIndex,
  Sysinfo,
  SysinfoIf
} from "@fnf/fnf-data";
import {BehaviorSubject, combineLatest, firstValueFrom, Observable, Subject} from "rxjs";
import {tap} from "rxjs/operators";
import {DockerRootDeletePipe} from "./component/main/header/tabpanel/filemenu/docker-root-delete.pipe";
import {LatestDataService} from "./domain/filepagedata/service/latest-data.service";
import {FavDataService} from "./domain/filepagedata/service/fav-data.service";
import {ChangeDirEventService} from "./service/change-dir-event.service";
import {ChangeDirEvent} from "./service/change-dir-event";
import {ActionId} from "./domain/action/fnf-action.enum";
import {Theme} from "./domain/customcss/css-theme-type";
import {TabData} from "./domain/filepagedata/data/tab.data";
import {FileTableBodyModel} from "./component/main/filetable/file-table-body-model";
import {SelectionManagerForObjectModels} from "./component/main/filetable/selection-manager";
import {CopyOrMoveOrDeleteDialogData} from "./component/cmd/copyormoveordelete/copy-or-move-or-delete-dialog.data";
import {
  CopyOrMoveOrDeleteDialogService
} from "./component/cmd/copyormoveordelete/copy-or-move-or-delete-dialog.service";
import {CommandService} from "./service/cmd/command.service";
import {QueueFileOperationParams} from "./domain/cmd/queue-file-operation-params";
import {ToolService} from "./service/tool.service";
import {ActionShortcutPipe} from "./common/action-shortcut.pipe";
import {SelectionDialogService} from "./component/cmd/selection/selection-dialog.service";
import {SelectionDialogData} from "./component/cmd/selection/selection-dialog.data";
import {FindDialogService} from "./component/cmd/find/find-dialog.service";
import {FindSocketService} from "./service/find.socketio.service";
import {ChangeDirDialogService} from "./component/cmd/changedir/change-dir-dialog.service";
import {ChangeDirDialogData} from "./component/cmd/changedir/data/change-dir-dialog.data";
import {TabsPanelData} from "./domain/filepagedata/data/tabs-panel.data";
import {ShellLocalStorage} from "./component/main/footer/shellpanel/shell-local-storage";
import {BrowserOsService} from "./service/browseros/browser-os.service";
import {PanelManagementService} from "./service/panel/panel-management-service";
import {ActionExecutionService} from "./service/action/action-execution.service";


@Injectable({
  providedIn: "root"
})
export class AppService {

  @Output() public onKeyUp$ = new Subject<KeyboardEvent>();
  @Output() public onKeyDown$ = new Subject<KeyboardEvent>();
  public sysinfo: SysinfoIf = new Sysinfo();
  public dockerRoot: string = '';
  public config: Config | undefined = undefined;
  public favs: string[] = [];
  public latest: string[] = [];
  public winDrives: string[] = [];
  public volumes: string[] = [];


  public readonly changeDirRequest$ = new Subject<ChangeDirEvent | null>();
  public readonly dirEvents$ = new BehaviorSubject<Map<string, DirEventIf[]>>(new Map());
  public readonly actionEvents$ = new Subject<ActionId>();
  public bodyAreaModels: [FileTableBodyModel | undefined, FileTableBodyModel | undefined] = [undefined, undefined];
  public selectionManagers: [SelectionManagerForObjectModels<FileItemIf> | undefined, SelectionManagerForObjectModels<FileItemIf> | undefined] = [undefined, undefined];
  public init$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private defaultTools: CmdIf[] = [];

  constructor(
    private readonly pms: PanelManagementService,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly lookAndFeelService: LookAndFeelService,
    private readonly shortcutService: ShortcutService,
    private readonly sysinfoService: SysinfoService,
    private readonly configService: ConfigService,
    private readonly fileSystemService: FileSystemService,
    private readonly latestDataService: LatestDataService,
    private readonly favDataService: FavDataService,
    private readonly changeDirEventService: ChangeDirEventService,
    private readonly copyOrMoveDialogService: CopyOrMoveOrDeleteDialogService,
    private readonly commandService: CommandService,
    private readonly toolService: ToolService,
    private readonly selectionDialogService: SelectionDialogService,
    private readonly findDialogService: FindDialogService,
    private readonly findSocketService: FindSocketService,
    private readonly changeDirDialogService: ChangeDirDialogService,
    private readonly shellLocalStorage: ShellLocalStorage,
    private readonly browserOsService: BrowserOsService,
  ) {


    this.favDataService
      .valueChanges()
      .subscribe(o => {
        this.favs = (o.filter((his, i, arr) => arr.indexOf(his) === i));
      });

    this.latestDataService
      .valueChanges()
      .subscribe(o => this.latest = (o.filter((his, i, arr) => arr.indexOf(his) === i)));

    this.sysinfoService
      .getDrives()
      .subscribe(winDrives => this.winDrives = winDrives);

    this.changeDirEventService.valueChanges()
      .subscribe(event => this.changeDirRequest$.next(event));

    this.changeDirRequest$.subscribe(changeDirEvent => {
      if (changeDirEvent) {
        this.setPathToActiveTabInGivenPanel(changeDirEvent.path, changeDirEvent.panelIndex);
      }
    });
  }

  // Get browserOs from BrowserOs service
  public get browserOs(): BrowserOsType {
    return this.browserOsService.browserOs;
  }

  public getSysinfo$(): Observable<SysinfoIf> {
    return this.sysinfoService.getSysinfo();
  }


  public getVolumes$(): Observable<string[]> {
    return this.fileSystemService.getVolumes$();
  }

  favs$() {
    return this.favDataService.valueChanges();
  }

  latest$() {
    return this.latestDataService.valueChanges();
  }

  getAllHistories$(): Observable<string[]> {
    return this.pms.getAllHistories$();
  }

  public init(callback: Function) {
    console.info('        > Browser OS       :', this.browserOs);

    const obs: [
      Observable<Config | undefined>,
      Observable<SysinfoIf>,
      Observable<string[]>,
      Observable<AllinfoIf>,
      Observable<ShortcutActionMapping | undefined>,
      Observable<CmdIf[] | undefined>,
      // Observable<string[]>
    ] = [
      this.configService.getConfig(),
      this.sysinfoService.getSysinfo(),
      this.sysinfoService.getDrives(),
      this.sysinfoService.getAllinfo(),

      this.shortcutService.getShortcuts(this.browserOs),
      this.toolService.fetchTools(this.browserOs),
      // this.fileSystemService.getVolumes$()
    ];

    combineLatest(obs)
      .pipe(
        // Set initial values from combineLatest
        tap(([
               config,
               sysinfo,
               winDrives,
               allInfo,
               shortcutActionMapping,
               defaultTools,
               // volumes
             ]) => {
          this.config = config;
          this.dockerRoot = this.config?.dockerRoot ?? '';
          DockerRootDeletePipe.dockerRoot = this.dockerRoot;
          this.sysinfo = sysinfo;
          this.winDrives = winDrives;
          // this.volumes = volumes;

          ActionShortcutPipe.shortcutCache = shortcutActionMapping ?? {};

          if (defaultTools) {
            this.defaultTools = defaultTools;
            ActionExecutionService.defaultTools = defaultTools;

            const toolMappings: ShortcutActionMapping = {};
            for (const tool of defaultTools) {
              toolMappings[tool.shortcut] = tool.id;
            }
            this.shortcutService.addAdditionalShortcutMappings(toolMappings);
            console.info('        > Tool Mappings    :', toolMappings);
          }
          // console.info('        > Volumes          :', this.volumes.join(', '));
          console.info('        > Default Tools    :', defaultTools);
          console.info('        > Active shortcuts :', this.shortcutService.getActiveShortcuts());
          console.info('        > Sysinfo          :', this.sysinfo);
          console.info('        > Config           :', this.config);
          console.info('        > All Info         :', allInfo);
        }),
      )
      .subscribe({
        next: () => {
          callback();
          this.init$.next(true);
        },
        error: (err) => {
          console.error('Error in init:', err);
          this.init$.next(false);
        }
      });
  }


  public changeDir(evt: ChangeDirEvent) {
    this.changeDirEventService.next(evt);
  }


  public async fetchDir(para: DirPara): Promise<void> {
    this.fileSystemService
      .fetchDir(para)
      .subscribe(
        {
          next: events => {
            const currentMap = this.dirEvents$.getValue();
            const newMap = new Map(currentMap);
            newMap.set(para.path, events);
            this.dirEvents$.next(newMap);
          },
          error: error => {
            console.error('Error fetching dir:', para.path);
            console.error(error);
          },
          complete: () => {
            // nothing
          }
        }
      );
  }


  public async checkPath(path: string): Promise<string> {
    return await firstValueFrom(this.fileSystemService.checkPath(path));
  }

  public async filterExists(files: string[]): Promise<string[]> {
    return await firstValueFrom(this.fileSystemService.filterExists(files));
  }

  public updateTabsPanelData(panelIndex: PanelIndex, fileData: TabsPanelData) {
    this.pms.updateTabsPanelData(panelIndex, fileData);
  }


  getActiveTabOnActivePanel(): TabData {
    return this.pms.getActiveTabOnActivePanel();
  }

  getAllHistories(): string[] {
    return this.pms.getAllHistories();
  }

  addLatest(item: string) {
    this.latestDataService.addLatest(item);
  }

  triggerAction(id: ActionId) {
    this.actionExecutionService.executeActionById(id);
    // console.log('> triggerAction:', id);
    // const panelIndex = this.pms.getActivePanelIndex();
    // const tabsPanelData = this.pms.getTabsPanelData(panelIndex);
    //
    // if (id === 'TOGGLE_PANEL') {
    //   this.pms.togglePanelSelection();
    //
    // } else if (id === 'NEXT_TAB') {
    //   tabsPanelData.selectedTabIndex = (tabsPanelData.selectedTabIndex + 1) % tabsPanelData.tabs.length;
    //   this.pms.updateTabsPanelData(panelIndex, tabsPanelData);
    //
    // } else if (id === 'TOGGLE_FILTER') {
    //   const tab = tabsPanelData.tabs[tabsPanelData.selectedTabIndex];
    //   tab.filterActive = !tab.filterActive;
    //   this.pms.updateTabsPanelData(panelIndex, tabsPanelData);
    //
    // } else if (id === 'TOGGLE_SHELL') {
    //   this.setShellVisible(!this.isShellVisible());
    //
    // } else if (id === 'TOGGLE_HIDDEN_FILES') {
    //   const tab = tabsPanelData.tabs[tabsPanelData.selectedTabIndex];
    //   tab.hiddenFilesVisible = !tab.hiddenFilesVisible;
    //   this.pms.updateTabsPanelData(panelIndex, tabsPanelData);
    //
    // } else if (id === 'REMOVE_TAB') {
    //   this.removeTab();
    //
    // } else if (id === 'ADD_NEW_TAB') {
    //   this.addNewTab();
    //
    // } else if (id === 'SELECT_LEFT_PANEL') {
    //   this.pms.setPanelActive(0);
    //
    // } else if (id === 'SELECT_RIGHT_PANEL') {
    //   this.pms.setPanelActive(1);
    //
    // } else if (id === "COPY_2_CLIPBOARD_FULLNAMES") {
    //   const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
    //   this.clipboardService.copyFullNames(rows);
    //
    // } else if (id === "COPY_2_CLIPBOARD_NAMES") {
    //   const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
    //   this.clipboardService.copyNames(rows);
    //
    // } else if (id === "COPY_2_CLIPBOARD_FULLNAMES_AS_JSON") {
    //   const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
    //   this.clipboardService.copyFullNamesAsJson(rows);
    //
    // } else if (id === "COPY_2_CLIPBOARD_NAMES_AS_JSON") {
    //   const rows = this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
    //   this.clipboardService.copyNamesAsJson(rows);
    //
    // } else if (id === "OPEN_ABOUT_DLG") {
    //   this.router.navigate(['/about']);
    //
    // } else if (id === "OPEN_SETUP_DLG") {
    //   this.router.navigate(['/setup']);
    //
    // } else if (id === "OPEN_SHELL_DLG") {
    //   this.router.navigate(['/shell']);
    //
    // } else if (id === "OPEN_RENAME_DLG") {
    //   this.rename();
    //
    // } else if (id === "OPEN_MULTIRENAME_DLG") {
    //   this.multiRename();
    //
    // } else if (id === "OPEN_MULTIMKDIR_DLG") {
    //   this.multiMkdir();
    //
    // } else if (id === "OPEN_GROUPFILES_DLG") {
    //   this.groupFiles();
    //
    // } else if (id === "OPEN_CHDIR_DLG") {
    //   this.openChangeDirDialog();
    //
    // } else if (id === "OPEN_FIND_DLG") {
    //   this.openFindDialog(null);
    //
    // } else if (id === "OPEN_DELETE_EMPTY_FOLDERS_DLG") {
    //   this.openCleanDialog(null);
    //
    // } else if (id === "OPEN_SHORTCUT_DLG") {
    //   this.shortcutDialogService.open();
    //
    // } else {
    //   for (const tool of this.defaultTools) {
    //     if (tool.id === id) {
    //       this.execute(tool);
    //       return;
    //     }
    //   }
    //   // console.log('> appService this.actionEventsSubject.next(id):', id);
    //   this.actionEvents$.next(id);
    // }
  }

  debug() {
    console.clear();
    console.info('sysinfo\n', JSON.stringify(this.sysinfo, null, 4));
    console.info('config\n', JSON.stringify(this.config, null, 4));
    console.info('winDrives\n', JSON.stringify(this.winDrives, null, 4));
    console.info('latest\n', JSON.stringify(this.latest, null, 4));
    console.info('favs\n', JSON.stringify(this.favs, null, 4));
    console.info('tabsPanelData 0\n', this.pms.getTabsPanelData(0));
    console.info('tabsPanelData 1\n', this.pms.getTabsPanelData(1));
    this.bodyAreaModels.forEach((bodyAreaModel, i) => {
      if (bodyAreaModel) {
        console.info('bodyAreaModel(' + i + ') focusedRowIndex:', bodyAreaModel.getFocusedRowIndex());
        console.info('bodyAreaModel(' + i + ') row count', bodyAreaModel.getRowCount());
        console.info('bodyAreaModel(' + i + ') rows:', bodyAreaModel.getAllRows());
      }
    });
  }



  setTheme(theme: Theme) {
    this.lookAndFeelService.loadAndApplyLookAndFeel(theme);
  }

  getActionByKeyEvent(keyboardEvent: KeyboardEvent): ActionId {
    return this.shortcutService.getActionByKeyEvent(keyboardEvent) as ActionId;
  }

  public async model2local(panelIndex: 0 | 1) {
    const tabData = this.getTabDataForPanelIndex(panelIndex);
    if (tabData) {
      if (tabData.path.startsWith('tabfind')) {
        this.updateTabsPanelData(panelIndex, this.pms.getTabsPanelData(panelIndex));

      } else {
        try {
          const path = await this.checkPath(tabData.path);
          if (tabData.path !== path) {
            await this.setPathToActiveTabInGivenPanel(path, panelIndex);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  public changeDirOnActivePabel(path: string) {
    this.setPathToActiveTabInGivenPanel(path, this.pms.getActivePanelIndex());
  }

  public onChangeDir(path: string, panelIndex: PanelIndex) {
    this.setPathToActiveTabInGivenPanel(path, panelIndex);
  }

  public async setPathToActiveTabInGivenPanel(
    path: string,
    panelIndex: PanelIndex) {

    try {
      let checkedPath = path;
      if (isZipUrl(path)) {
        // no path check
      } else {
        checkedPath = await this.checkPath(path);
      }
      const skipNextHistoryChange = ChangeDirEventService.skipNextHistoryChange;
      this.pms.setPathToActiveTabInGivenPanel(checkedPath, panelIndex, skipNextHistoryChange);
      ChangeDirEventService.skipNextHistoryChange = false;
      if (!skipNextHistoryChange) this.addLatest(checkedPath);

    } catch (e) {
      console.error(e);
    }
  }


  setBodyAreaModel(panelIndex: PanelIndex, m: FileTableBodyModel) {
    this.bodyAreaModels[panelIndex] = m;
  }

  setSelectionManagers(panelIndex: PanelIndex, m: SelectionManagerForObjectModels<FileItemIf>) {
    this.selectionManagers[panelIndex] = m;
  }

  getDirsFromAllTabs(): string[] {
    return this.pms.getDirsFromAllTabs();
  }

  navigateBack() {
    const panelIndex = this.pms.getActivePanelIndex();
    const tabsPanelData = this.pms.getTabsPanelData(panelIndex);
    const tabData = tabsPanelData.tabs[tabsPanelData.selectedTabIndex];

    if (!tabData.historyIndex) tabData.historyIndex = 0;
    tabData.historyIndex = Math.max(0, tabData.historyIndex + 1);
    tabData.historyIndex = Math.min(tabData.historyIndex, tabData.history.length - 1);
    ChangeDirEventService.skipNextHistoryChange = true;

    const path = tabData.history[tabData.historyIndex];
    this.pms.updateTabsPanelData(panelIndex, tabsPanelData);
    this.changeDir(new ChangeDirEvent(panelIndex, path));
  }

  navigateForward() {
    const panelIndex = this.pms.getActivePanelIndex();
    const tabsPanelData = this.pms.getTabsPanelData(panelIndex);
    const tabData = tabsPanelData.tabs[tabsPanelData.selectedTabIndex];

    if (!tabData.historyIndex) tabData.historyIndex = 0;
    tabData.historyIndex--;
    if (tabData.historyIndex < 0) tabData.historyIndex = tabData.history.length - 1;
    if (tabData.historyIndex > tabData.history.length - 1) tabData.historyIndex = 0;
    ChangeDirEventService.skipNextHistoryChange = true;

    const path = tabData.history[tabData.historyIndex];

    this.pms.updateTabsPanelData(panelIndex, tabsPanelData);
    this.changeDir(new ChangeDirEvent(panelIndex, path));
  }

  open(fileItem?: FileItemIf) {
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

  getDefaultTools(): CmdIf[] {
    return this.defaultTools;
  }

  execute(cmd: CmdIf) {
    const currentDir = this.getActiveTabOnActivePanel().path;
    const fileItems: FileItemIf[] = this.getSelectedOrFocussedDataForActivePanel();

    const cmds: CmdIf[] = [];
    for (let i = 0; i < fileItems.length; i++) {
      const fileItem = fileItems[i];
      const cmdClone = this.clone(cmd);
      cmdClone.para = cmdClone.para
        .replace(/\$file/g, fileItem.dir + '/' + fileItem.base)
        .replace(/\$dir/g, currentDir);
      cmds.push(cmdClone);
    }

    this.toolService.execute(cmds);
  }

  openSelectionDialog(data: SelectionDialogData, cb: (result: string | undefined) => void) {
    this.selectionDialogService.open(data, cb);
  }

  getSelectedOrFocussedData(panelIndex: PanelIndex): FileItemIf[] {
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

  getFirstShortcutByActionAsTokens(action: ActionId): string[] {
    return this.shortcutService.getFirstShortcutByActionAsTokens(action);
  }

  getShortcutAsLabelTokens(sc: string): string[] {
    return this.shortcutService.getShortcutAsLabelTokens(sc);
  }

  public addTab(panelIndex: PanelIndex, tabData: TabData) {
    const tabsPanelData = this.pms.getTabsPanelData(panelIndex);

    tabsPanelData.tabs.push(tabData);
    tabsPanelData.selectedTabIndex = tabsPanelData.tabs.length - 1;
    this.updateTabsPanelData(panelIndex, tabsPanelData);
  }


  // TODO marc xxxx ActionExecutionService, aber hier leider mit data: FindDialogData  . was tun?
  public openFindDialog(
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
            this.addTab(panelIndex, tabDataFindings);

          } else {
            const tabsPanel = this.pms.getTabsPanelData(panelIndex);
            const tabData = tabsPanel.tabs[tabsPanel.selectedTabIndex];
            tabData.path = findData.dirTabKey;
            tabData.findData = findData;
            this.updateTabsPanelData(panelIndex, this.pms.getTabsPanelData(panelIndex));
          }
        }
      });
  }


  requestFindings(findData: FindData) {
    this.findSocketService
      .find(findData, event => {
        const currentMap = this.dirEvents$.getValue();
        const newMap = new Map(currentMap);
        newMap.set(findData.dirTabKey, [event]);
        this.dirEvents$.next(newMap);
      });
  }

  callActionMkDir(para: { dir: string; base: string; panelIndex: PanelIndex }) {
    const actionEvent = this.commandService.createQueueActionEventForMkdir(para);
    this.commandService.addActions([actionEvent]);
  }



  isShellVisible() {
    return this.shellLocalStorage.isShellVisible();
  }

  shellVisibilityChanges$(): BehaviorSubject<boolean> {
    return this.shellLocalStorage.valueChanges$();
  }


  private getSelectedData(panelIndex: PanelIndex): FileItemIf[] {
    return this.selectionManagers[panelIndex]?.getSelectedRows() ?? [];
  }


  private clone<T>(o: T): T {
    return JSON.parse(JSON.stringify(o));
  }

  private getTabDataForPanelIndex(panelIndex: 0 | 1): TabData {
    const panelData: TabsPanelData = this.pms.getTabsPanelData(panelIndex);
    return panelData.tabs[panelData.selectedTabIndex];
  }

  private getSelectedDataForActivePanel(): FileItemIf[] {
    return this.getSelectedData(this.pms.getActivePanelIndex());
  }

  private getSelectedOrFocussedDataForActivePanel(): FileItemIf[] {
    return this.getSelectedOrFocussedData(this.pms.getActivePanelIndex());
  }

  private getRelevantDirsFromActiveTab(): string[] {
    let fileItems = this.getSelectedDataForActivePanel().filter(fi => fi.isDir);
    if (fileItems.length === 1 && fileItems[0].base === DOT_DOT) {
      fileItems = [];
    }
    if (fileItems.length) {
      return fileItems.map(fi => `${fi.dir}/${fi.base}`);
    }
    return [this.getActiveTabOnActivePanel().path];
  }


}
