import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RenderWrapperFactory, TableComponent} from "@guiexpert/angular-table";
import {
  ColumnDef,
  GeMouseEvent,
  Size,
  TableApi,
  TableFactory,
  TableModelIf,
  TableOptions,
  TableOptionsIf
} from "@guiexpert/table";
import {NameCellRendererComponent} from "./renderer/name-cell-renderer.component";
import {DateCellRendererComponent} from "./renderer/date-cell-renderer.component";
import {SizeCellRendererComponent} from "./renderer/size-cell-renderer.component";
import {
  ButtonEnableStates,
  DirEventIf,
  DirPara,
  DOT_DOT,
  EXP_ZIP_FILE_URL,
  FileItem,
  FileItemIf,
  FileItemMeta,
  FindData,
  getParent,
  getZipUrlInfo,
  isRoot,
  isSameDir,
  isZipBase,
  isZipUrl,
  PanelIndex,
  ZipUrlInfo,
} from "@fnf-data";
import {fileNameComparator} from "./comparator/name-comparator";
import {extComparator} from "./comparator/ext-comparator";
import {sizeComparator} from "./comparator/size-comparator";
import {dateComparator} from "./comparator/date-comparator";
import {AppService} from "../../../app.service";
import {ChangeDirEvent} from "../../../service/change-dir-event";
import {SelectionManagerForObjectModels} from "./selection-manager";
import {FileTableBodyModel} from "./file-table-body-model";
import {TabsPanelData} from "../../../domain/filepagedata/data/tabs-panel.data";
import {Subject} from "rxjs";
import {takeWhile} from "rxjs/operators";
import {GridSelectionCountService} from "../../../service/grid-selection-count.service";
import {SelectionEvent} from "../../../domain/filepagedata/data/selection-event";
import {SelectionLocalStorage} from "./selection-local-storage";
import {GotoAnythingDialogService} from "../../cmd/gotoanything/goto-anything-dialog.service";
import {GotoAnythingDialogData} from "../../cmd/gotoanything/goto-anything-dialog.data";
import {GotoAnythingOptionData} from "../../cmd/gotoanything/goto-anything-option.data";
import {ActionId, actionIds} from "../../../domain/action/fnf-action.enum";
import {FnfActionLabels} from "../../../domain/action/fnf-action-labels";
import {NotifyService} from "../../../service/cmd/notify-service";
import {QueueNotifyEventIf} from "../../../domain/cmd/queue-notify-event.if";
import {FocusLocalStorage} from "./focus-local-storage";
import {MkdirDialogResultData} from "../../cmd/mkdir/mkdir-dialog-result.data";
import {MkdirDialogService} from "../../cmd/mkdir/mkdir-dialog.service";
import {DirWalker} from "./dir-walker";
import {equalFileItem} from "../../../common/fn/equal-file-item.fn";
import {fileItemSorter} from "../../../common/fn/file-item-sorter.fn";
import {WalkdirService} from "../../../common/walkdir/walkdir.service";
import {ExtensionCellRendererComponent} from "./renderer/extension-cell-renderer.component";
import {ActionExecutionService} from "../../../service/action/action-execution.service";
import {CreateFileDialogService} from "../../cmd/createfile/create-file-dialog.service";
import {CreateFileDialogResultData} from "../../cmd/createfile/create-file-dialog-result.data";
import {CreateFileDialogData} from "../../cmd/createfile/create-file-dialog.data";
import {MkdirDialogData} from "../../cmd/mkdir/mkdir-dialog.data";


@Component({
  standalone: true,
  selector: 'app-file-table',
  imports: [
    CommonModule,
    TableComponent
  ],
  templateUrl: './file-table.component.html',
  styleUrls: [
    './file-table.component.css'
  ]
})
export class FileTableComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() selected: boolean = false;
  @Output() selectionLabelDataChanged = new Subject<SelectionEvent>();
  @Output() buttonStatesChanged = new Subject<ButtonEnableStates>();
  tableModel?: TableModelIf;
  private readonly rowHeight = 34;
  readonly tableOptions: TableOptionsIf = {
    ...new TableOptions(),
    hoverColumnVisible: false,
    defaultRowHeights: {
      header: this.rowHeight,
      body: this.rowHeight,
      footer: 0
    },
    horizontalBorderVisible: false,
    verticalBorderVisible: false,
    externalFilterFunction: this.filterFn.bind(this),
    getSelectionModel: () => undefined,
    getFocusModel: () => undefined,
    shortcutActionsDisabled: true,
    columnsDraggable: false,
  };
  private readonly columnDefs = [
    ColumnDef.create({
      property: "base",
      headerLabel: "Name",
      width: new Size(100, 'weight'),
      minWidth: new Size(200, 'px'),
      bodyRenderer: this.rwf.create(NameCellRendererComponent, this.cdr),
      headerClasses: ["ge-table-text-align-left"],
      bodyClasses: ["ge-table-text-align-left"],
      sortable: () => true,
      sortComparator: fileNameComparator
    }),
    ColumnDef.create({
      property: "ext",
      headerLabel: "Ext",
      width: new Size(60, 'px'),
      bodyRenderer: this.rwf.create(ExtensionCellRendererComponent, this.cdr),
      headerClasses: ["ge-table-text-align-left"],
      bodyClasses: ["ge-table-text-align-left"],
      sortable: () => true,
      sortComparator: extComparator
    }),
    ColumnDef.create({
      property: "size",
      headerLabel: "Size",
      width: new Size(100, 'px'),
      bodyRenderer: this.rwf.create(SizeCellRendererComponent, this.cdr),
      headerClasses: ["ge-table-text-align-right"],
      bodyClasses: ["ge-table-text-align-right"],
      sortable: () => true,
      sortComparator: sizeComparator
    }),
    ColumnDef.create({
      property: "date",
      headerLabel: "Date",
      width: new Size(160, 'px'),
      bodyRenderer: this.rwf.create(DateCellRendererComponent, this.cdr),
      headerClasses: ["ge-table-text-align-left"],
      bodyClasses: ["ge-table-text-align-left"],
      sortable: () => true,
      sortComparator: dateComparator
    }),
  ];
  public readonly bodyAreaModel = new FileTableBodyModel(
    this.columnDefs,
    this.rowHeight,
    this.onFocusChanged.bind(this)
  );
  private readonly selectionManager = new SelectionManagerForObjectModels<FileItemIf>(
    this.bodyAreaModel,
    {
      isSelectable: (row: FileItemIf) => row.base !== DOT_DOT,
      isSelected: (row: FileItemIf) => (row?.meta?.selected ?? false),
      setSelected: (row: FileItemIf, selected: boolean) => {
        if (!row.meta) row.meta = new FileItemMeta();
        row.meta.selected = selected;
      },
      getKey: (row: FileItemIf) => row.dir + '/' + row.base,
      equalRows: equalFileItem,
    });
  private tableApi: TableApi | undefined;
  private alive = true;
  private injector = inject(Injector);
  private hiddenFilesVisible = true;
  private filterText = "";
  private filterActive = false;
  private dirPara?: DirPara;
  private findDataOld: FindData | undefined;
  private initialized = false;
  private cancellings: string[] = [];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly rwf: RenderWrapperFactory,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly appService: AppService,
    private readonly gridSelectionCountService: GridSelectionCountService,
    public readonly gotoAnythingDialogService: GotoAnythingDialogService,
    private readonly notifyService: NotifyService,
    private readonly selectionLocalStorage: SelectionLocalStorage,
    private readonly focusLocalStorage: FocusLocalStorage,
    private readonly mkdirDialogService: MkdirDialogService,
    private readonly createFileDialogService: CreateFileDialogService,
    private readonly walkdirService: WalkdirService,
  ) {
    this.columnDefs.forEach(def => {
      def.sortable = () => true;
      def.sortIconVisible = () => true;
    });

    this.tableModel = TableFactory.createTableModel({
      columnDefs: this.columnDefs,
      tableOptions: this.tableOptions,
      bodyAreaModel: this.bodyAreaModel
    });
  }

  private _panelIndex: PanelIndex = 0;

  get panelIndex(): PanelIndex {
    return this._panelIndex;
  }

  @Input() set panelIndex(value: PanelIndex) {
    this._panelIndex = value;
  }

  private _tabsPanelData?: TabsPanelData;

  get tabsPanelData(): TabsPanelData | undefined {
    return this._tabsPanelData;
  }

  @Input() set tabsPanelData(value: TabsPanelData) {
    this._tabsPanelData = value;

    const selectedTabData = this._tabsPanelData.tabs[this._tabsPanelData.selectedTabIndex];
    //this.focusRowCriterea = selectedTabData.focusRowCriterea

    const filterChanged =
      this.filterText !== selectedTabData.filterText
      || this.filterActive !== selectedTabData.filterActive
      || this.hiddenFilesVisible !== selectedTabData.hiddenFilesVisible
    ;
    this.hiddenFilesVisible = selectedTabData.hiddenFilesVisible;
    this.filterText = selectedTabData.filterText ?? '';
    this.filterActive = selectedTabData.filterActive ?? false;

    if (!this.dirPara
      || this.dirPara?.path !== selectedTabData.path) {

      if (selectedTabData.findData) {
        if (this.tableApi) {
          this.tableApi.setRows([]);
          this.repaintTable();
        }
        this.dirPara = new DirPara(selectedTabData.path, `file-panel-${this._panelIndex}`);
        this.requestRows();

      } else if (!this.dirPara || this.dirPara?.path !== selectedTabData.path) {
        if (this.tableApi) {
          this.tableApi.setRows([]);
          this.repaintTable();
        }

        this.dirPara = new DirPara(selectedTabData.path, `file-panel-${this._panelIndex}`);
        this.requestRows();
      }
    }
    if (filterChanged && this.tableApi) {
      this.tableApi.externalFilterChanged();
      this.tableApi.reSort();
      this.tableApi.repaintHard();
    }
  }

  // }
  private _focusSearch: string = '';

  get focusSearch(): string {
    return this._focusSearch;
  }

  @Input()
  set focusSearch(value: string) {
    this._focusSearch = value;
    this.jump2RowByBaseSearch(value);
  }

  ngOnInit(): void {
    this.actionExecutionService.setBodyAreaModel(this._panelIndex, this.bodyAreaModel);
    this.actionExecutionService.setSelectionManagers(this._panelIndex, this.selectionManager);
    this.appService.setBodyAreaModel(this._panelIndex, this.bodyAreaModel);
    this.appService.setSelectionManagers(this._panelIndex, this.selectionManager);

    this.appService
      .onKeyDown$
      .pipe(takeWhile(() => this.alive))
      .subscribe(evt => {
        if (this.selected) {
          this.onKeyDown(evt);
        }
      });

    this.appService
      .onKeyUp$
      .pipe(takeWhile(() => this.alive))
      .subscribe(evt => {
        if (this.selected) {
          this.onKeyUp(evt);
        }
      });


    // Subscribe to selection$ changes
    this.selectionManager
      .selection$
      .pipe(takeWhile(() => this.alive))
      .subscribe(selectedRows => {
        this.calcButtonStates(selectedRows);
      });

    this.appService
      .dirEvents$
      .pipe(takeWhile(() => this.alive))
      .subscribe(dirEventsMap => {
        if (this.dirPara?.path) {
          const dirEvents = dirEventsMap.get(this.dirPara.path);
          if (dirEvents) this.handleDirEvent(dirEvents);
        }
      });

    this.actionExecutionService
      .actionEvents$
      .pipe(takeWhile(() => this.alive))
      .subscribe(actionEvent => {

        if (actionEvent === 'RELOAD_DIR') {
          // we do the reload on both panels (selected and unselected panel):
          this.reload();

        } else if (
          (actionEvent === 'RELOAD_DIR_0' && this.panelIndex === 0)
          || (actionEvent === 'RELOAD_DIR_1' && this.panelIndex === 1)
        ) {
          // we do the reload on this panel only:
          this.reload();

        } else if (actionEvent && this.selected) {
          // we are on the active panel:
          this.actionCall(actionEvent);
        }
      });

    this.notifyService
      .valueChanges()
      .pipe(takeWhile(() => this.alive))
      .subscribe(
        (evt: QueueNotifyEventIf) => {
          if (Array.isArray(evt.data)) {
            const arr = evt.data as Array<DirEventIf>;
            this.handleDirEvent(arr);
          }
        }
      );

  }


  ngAfterViewInit(): void {
    this.initialized = true;
  }


  ngOnDestroy(): void {
    this.alive = false;
  }

  reload() {
    if (this.tableApi) {
      this.tableApi.setRows([]);
      this.repaintTable();
    }
    this.requestRows();
  }

  getButtonEnableStates(items: FileItemIf[]): ButtonEnableStates {
    const states = new ButtonEnableStates();

    states.OPEN_COPY_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
    states.OPEN_EDIT_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL) && !items[0].isDir;
    states.OPEN_VIEW_DLG = states.OPEN_EDIT_DLG;
    states.OPEN_MOVE_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
    states.OPEN_DELETE_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
    states.OPEN_MKDIR_DLG = !this.dirPara?.path.startsWith('tabfind');
    states.OPEN_RENAME_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
    states.OPEN_UNPACK_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
    states.OPEN_MULTIRENAME_DLG = items?.length > 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
    return states;
  }


  onMouseClicked(evt: GeMouseEvent) {
    if (evt.clickCount === 2 && evt.areaIdent === 'body' && this.tableModel) {
      const fileItem: FileItemIf = this.bodyAreaModel.getRowByIndex(evt.rowIndex);
      if (isZipBase(fileItem.base)) {
        this.changeDir(fileItem);
      } else if (fileItem.isDir) {
        this.changeDir(fileItem);
      } else {
        this.appService.open(fileItem);
      }

    } else if (evt.clickCount === 1 && evt.areaIdent === 'body' && this.tableModel) {
      if (this.tableApi) {
        if (evt.rowIndex > -1) this.setFocus2Index(evt.rowIndex);
        this.selectionManager.handleGeMouseEvent(evt);
      }
    }
    if (this.tableApi) {
      this.tableApi?.repaint();
    }
  }


  onKeyUp(evt: KeyboardEvent) {
    this.selectionManager.handleKeyUpEvent(evt);
  }

  onKeyDown(evt: KeyboardEvent) {
    this.selectionManager.handleKeyDownEvent(evt);
  }

  async requestRows(): Promise<void> {
    let findData: FindData | undefined = undefined;
    if (this._tabsPanelData) {
      const selectedTabData = this._tabsPanelData.tabs[this._tabsPanelData.selectedTabIndex];
      if (selectedTabData.findData) {
        findData = selectedTabData.findData;
      }
    }

    if (findData) {
      if (this.findDataOld) {
        // TODO this.appService.cancelFind(findData);
      }
      this.findDataOld = structuredClone(findData);
      // request findings:
      this.appService.requestFindings(findData);

    } else if (this.dirPara) {
      // request directory entries
      try {
        await this.appService.fetchDir(this.dirPara);
      } catch (e) {
        console.error(e);
      }
    }
  }


  handleDirEvent(dirEvents: DirEventIf[]): void {
    if (this.tableApi && dirEvents && this.dirPara) {
      for (let i = 0; i < dirEvents.length; i++) {
        const dirEvent = dirEvents[i];
        const zi: ZipUrlInfo = getZipUrlInfo(this.dirPara.path);

        if (this.dirPara.path.startsWith('tabfind')
          || this.isRelevantDir(dirEvent.dir, this.dirPara.path, zi)) {
          this.handleRelevantDirEvent(dirEvent, zi);
        }
      }
    }
  }


  onTableReady(tableApi: TableApi) {
    this.tableApi = tableApi;
    this.selectionManager.tableApi = tableApi;
  }


  async actionCall(action: string) {
    console.info('filetable> actionCall: ', action);
    if (action === 'RELOAD_DIR') {
      this.reload();

    } else if (action === 'SELECT_ALL') {
      this.selectionManager.selectionAll();
      this.tableApi?.repaint();

    } else if (action === 'DESELECT_ALL') {
      this.selectionManager.deSelectionAll();
      this.tableApi?.repaint();

    } else if (action === 'TOGGLE_SELECTION') {
      this.selectionManager.toggleSelection();
      this.tableApi?.repaint();

    } else if (action === 'TOGGLE_SELECTION_CURRENT_ROW') {
      const row = this.bodyAreaModel.getRowByIndex(this.bodyAreaModel.getFocusedRowIndex());
      this.selectionManager.toggleRowSelection(row);
      this.tableApi?.repaint();

    } else if (action === "ENHANCE_SELECTION") {
      this.openSelectionDialog(true);

    } else if (action === "REDUCE_SELECTION") {
      this.openSelectionDialog(false);

    } else if (action === "SPACE_PRESSED") {
      const r = this.bodyAreaModel.getFocusedRowIndex();
      if (this.tableApi && r > -1) {
        const row = this.bodyAreaModel.getRowByIndex(r);

        if (row?.isDir) {
          const dir = row.dir + '/' + row.base;

          const dirWalker = new DirWalker(row, this.tableApi, () => {
            const selectedRows = this.selectionManager.getSelectionValue();
            this.calcSelectionLabelData(selectedRows);
          });

          this.cancellings.push(
            this.walkdirService.walkDir(
              [dir],
              '**/*',
              dirWalker.walkCallback.bind(dirWalker)
            ));
        }
      }

    } else if (action === "ENTER_PRESSED") {
      const r = this.bodyAreaModel.getFocusedRowIndex();
      if (r > -1) {
        const row = this.bodyAreaModel.getRowByIndex(r);

        if (isZipBase(row.base)) {
          this.changeDir(row);

        } else if (row?.isDir) {
          this.changeDir(row);

        } else {
          if (!isZipUrl(row.dir)) {
            this.appService.open(row);
          } else {
            // TODO later
          }

        }
      }


    } else if (action === "HOME_PRESSED") {
      this.setFocus2Index(0);

    } else if (action === "END_PRESSED") {
      this.setFocus2Index(Math.max(0, this.bodyAreaModel.getRowCount() - 1));

    } else if (action === "ARROW_UP") {
      this.setFocus2Index(Math.max(0, this.bodyAreaModel.getFocusedRowIndex() - 1));

    } else if (action === "ARROW_DOWN") {
      this.setFocus2Index(Math.min(this.bodyAreaModel.getRowCount() - 1, this.bodyAreaModel.getFocusedRowIndex() + 1));

    } else if (action === "PAGEUP_PRESSED") {
      this.setFocus2Index(Math.max(0, this.bodyAreaModel.getFocusedRowIndex() - this.getDisplayedRowCount() + 1));

    } else if (action === "PAGEDOWN_PRESSED") {
      this.setFocus2Index(Math.min(this.bodyAreaModel.getRowCount() - 1, this.bodyAreaModel.getFocusedRowIndex() + this.getDisplayedRowCount() + 1));

    } else if (action === "NAVIGATE_LEVEL_DOWN") {
      const fileItem = this.bodyAreaModel.getRowByIndex(0);
      if (fileItem.isDir) {
        if (fileItem.base === DOT_DOT) {
          this.appService.changeDir(new ChangeDirEvent(this._panelIndex, fileItem.dir));
        }
      }
    } else if (action === "OPEN_MKDIR_DLG") {
      this.openMakeDirDlg();
    } else if (action === "OPEN_CREATE_FILE_DLG") {
      this.openCreateFileDlg();

    } else if (action === 'OPEN_GOTO_ANYTHING_DLG') {
      const activeTabOnActivePanel = this.appService.getActiveTabOnActivePanel();
      const firstInput = activeTabOnActivePanel.path;
      const firstOptions: string[] = [];
      let dirs: string[] =
        [
          ...this.appService.getDirsFromAllTabs(),
          ...this.appService.getAllHistories(),
        ]
          .filter((his, i, arr) => arr.indexOf(his) === i) // remove double entries
          .sort();
      dirs = await this.appService.filterExists(dirs);

      const commands: GotoAnythingOptionData[] = actionIds.map((id) => {
        return new GotoAnythingOptionData(id, FnfActionLabels.getLabel(id))
      })

      this.gotoAnythingDialogService.open(
        new GotoAnythingDialogData(
          firstInput,
          dirs,
          commands,
          firstOptions
        ),
        (result: GotoAnythingOptionData | undefined) => {
          if (result) {
            if (result.cmd?.toLowerCase() === 'cd') {
              this.appService.onChangeDir(result.value, this._panelIndex);
            } else {
              this.appService.triggerAction(result.cmd as ActionId);
            }
          }
        }
      )

    } else if (action === "NAVIGATE_BACK") {
      this.appService.navigateBack();
    } else if (action === "NAVIGATE_FORWARD") {
      this.appService.navigateForward();
    }
  }

  openCreateFileDlg() {
    const panelIndex = this.panelIndex;
    const activeTabOnActivePanel = this.appService.getActiveTabOnActivePanel();
    const dir = this.dirPara?.path ?? activeTabOnActivePanel.path;
    const focussedData = this.getFocussedData();

    const existingFiles = this.bodyAreaModel
      ? this.bodyAreaModel
        .getAllRows()
        .filter(item => item.isDir && item.base !== DOT_DOT)
        .map(item => item.base)
      : [];

    const suggestedName = focussedData?.base ?? '';
    const data = new CreateFileDialogData(dir, suggestedName, existingFiles);


    this.createFileDialogService
      .open(data, (result: CreateFileDialogResultData | undefined) => {
        if (result && this.dirPara?.path) {
          const para = {
            dir: result.target.dir,
            base: result.target.base,
            ext: result.target.ext,
            panelIndex
          };
          this.focusLocalStorage.persistFocusCriteria(this.panelIndex, this.dirPara.path, {
            dir: para.dir,
            base: para.base,
            ext: para.ext,
          });
          this.actionExecutionService.callActionCreateFile(para);
        }
      });
  }

  openMakeDirDlg() {
    const panelIndex = this.panelIndex;
    const activeTabOnActivePanel = this.appService.getActiveTabOnActivePanel();
    const dir = this.dirPara?.path ?? activeTabOnActivePanel.path;
    const focussedData = this.getFocussedData();

    // Get existing subdirectories for validation
    const existingSubdirectories = this.bodyAreaModel
      ? this.bodyAreaModel
        .getFilteredRows()
        .filter(item => item.isDir && item.base !== DOT_DOT)
        .map(item => item.base)
      : [];

    // Try to detect sequential pattern and suggest next sequence
    const suggestedName = this.getNextSequentialDirName() || (focussedData?.base ?? '');
    const data = new MkdirDialogData(dir, suggestedName, existingSubdirectories);

    this.mkdirDialogService
      .open(data, (result: MkdirDialogResultData | undefined) => {
        if (result && this.dirPara?.path) {
          const para = {
            dir: result.target.dir,
            base: result.target.base,
            panelIndex
          };
          this.focusLocalStorage.persistFocusCriteria(this.panelIndex, this.dirPara.path, {
            dir: para.dir,
            base: para.base
          });
          this.actionExecutionService.callActionMkDir(para);
        }
      });
  }

  setFocus2Index(index: number) {
    this.bodyAreaModel.setFocusedRowIndex(index);
    const partial = this.bodyAreaModel.getCriteriaFromFocussedRow();

    const activeTabOnActivePanel = this.appService.getActiveTabOnActivePanel();
    const dir = this.dirPara?.path ?? activeTabOnActivePanel.path;

    this.focusLocalStorage.persistFocusCriteria(this.panelIndex, dir, partial);
    this.tableApi?.repaint();

    const selectedRows = this.selectionManager.getSelectionValue();
    this.calcButtonStates(selectedRows);
  }

  /**
   * Detects sequential patterns in directory names and suggests the next sequence number.
   * Supports patterns like S01, S02, S03 or E01, E02, E03, etc.
   * @returns The suggested next directory name or null if no pattern is detected
   */
  private getNextSequentialDirName(): string | null {
    if (!this.bodyAreaModel) {
      return null;
    }

    // Get all directories in the current directory
    const directories = this.bodyAreaModel
      .getFilteredRows()
      .filter(item => item.isDir && item.base !== DOT_DOT)
      .map(item => item.base);

    if (directories.length === 0) {
      return null;
    }

    // Try to detect sequential patterns
    const patterns = this.detectSequentialPatterns(directories);

    if (patterns.length > 0) {
      // Use the pattern with the highest sequence number
      const bestPattern = patterns.reduce((max, current) =>
        current.maxNumber > max.maxNumber ? current : max
      );

      return this.generateNextSequenceName(bestPattern);
    }

    return null;
  }

  /**
   * Detects sequential patterns in directory names.
   * @param directories Array of directory names
   * @returns Array of detected patterns with their details
   */
  private detectSequentialPatterns(directories: string[]): Array<{
    prefix: string,
    maxNumber: number,
    digits: number
  }> {
    const patterns: Map<string, { maxNumber: number, digits: number, count: number }> = new Map();

    // Regular expression to match patterns like S01, E02, etc.
    // More restrictive: prefix should be short (1-10 chars) and numbers should be zero-padded (2+ digits) or follow sequential pattern
    const sequenceRegex = /^([A-Za-z]{1,10})(\d{2,})$/;

    for (const dir of directories) {
      const match = dir.match(sequenceRegex);
      if (match) {
        const prefix = match[1];
        const numberStr = match[2];
        const number = parseInt(numberStr, 10);
        const digits = numberStr.length;

        // Additional validation: ensure it looks like a sequential pattern
        // Skip if it looks like a regular word with numbers (e.g., "folder1", "file123")
        if (this.isValidSequentialPattern(prefix, numberStr)) {
          if (!patterns.has(prefix)) {
            patterns.set(prefix, {maxNumber: number, digits: digits, count: 1});
          } else {
            const existing = patterns.get(prefix)!;
            existing.count++;
            if (number > existing.maxNumber) {
              existing.maxNumber = number;
              // Use the digit count from the highest number
              existing.digits = digits;
            }
          }
        }
      }
    }

    // Only return patterns that have at least 2 occurrences (indicating a sequence)
    return Array.from(patterns.entries())
      .filter(([_, data]) => data.count >= 2)
      .map(([prefix, data]) => ({
        prefix,
        maxNumber: data.maxNumber,
        digits: data.digits
      }));
  }

  /**
   * Validates if a prefix and number combination looks like a valid sequential pattern.
   * @param prefix The alphabetic prefix
   * @param numberStr The numeric part as string
   * @returns true if it looks like a valid sequential pattern
   */
  private isValidSequentialPattern(prefix: string, numberStr: string): boolean {
    // Pattern should have:
    // 1. Short prefix (typically 1-3 characters for S, E, Season, etc.)
    // 2. Zero-padded numbers (starts with 0 and has 2+ digits) OR
    // 3. Prefix is very short (1-2 chars) which are common for sequences

    const isZeroPadded = numberStr.startsWith('0') && numberStr.length >= 2;
    const isShortPrefix = prefix.length <= 3;
    const isCommonSequencePrefix = /^[A-Za-z]{1,2}$/.test(prefix); // 1-2 character prefixes like S, E, EP, etc.

    return isZeroPadded || (isShortPrefix && isCommonSequencePrefix);
  }

  /**
   * Generates the next sequence name based on the detected pattern.
   * @param pattern The detected pattern with prefix, max number, and digit count
   * @returns The next sequence name
   */
  private generateNextSequenceName(pattern: { prefix: string, maxNumber: number, digits: number }): string {
    const nextNumber = pattern.maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(pattern.digits, '0');
    return `${pattern.prefix}${paddedNumber}`;
  }

  private jump2RowByBaseSearch(value: string) {
    if (!value) return;
    if (this.selected && this.tableApi && this.bodyAreaModel && value) {
      const v = value.toLowerCase();
      const index = this.bodyAreaModel.getFilteredRows().findIndex(
        (row: FileItemIf, index: number, obj: FileItemIf[]) => row.base.toLowerCase().startsWith(v)
      )
      if (index > -1) {
        this.bodyAreaModel.setFocusedRowIndex(index);
      }
    }
  }

  private getFocussedData(): FileItemIf | null {
    if (this.bodyAreaModel) {
      const focusedRowIndex = this.bodyAreaModel.getFocusedRowIndex() ?? 0;
      const frd = this.bodyAreaModel.getRowByIndex(focusedRowIndex) ?? null;
      return frd ?? null;
    }
    return null;
  }

  private openSelectionDialog(enhance: boolean) {
    console.info('filetable openSelectionDialog', enhance);
    this.actionExecutionService.openSelectionDialog(
      this.panelIndex,
      enhance,
      (data) => this.handleSelectionDialogResult(data, enhance)
    );
  }

  private handleSelectionDialogResult(data: string | undefined, enhance: boolean) {
    if (data) {
      const fs = data.toLowerCase().split(' ');

      const negs = fs?.filter(f => f.startsWith('-'))
        .map(f => f.substring(1).trim())
        .filter(f => f);

      const poss = fs?.filter(f => !f.startsWith('-'))
        .map(f => f.replace(/^\+/g, '').trim())
        .filter(f => f);

      const rows = this.bodyAreaModel
        .getFilteredRows()
        .filter(r =>
            r.base !== DOT_DOT
            && poss.every(f => {
              if (f.includes('|')) {
                const ors = f.split('|');
                return ors.some(or => r.base.toLowerCase().includes(or));
              }
              return r.base.toLowerCase().includes(f)
            })
            && negs.every(f => {
              if (f.includes('|')) {
                const ors = f.split('|');
                return !ors.some(or => r.base.toLowerCase().includes(or));
              }
              return !r.base.toLowerCase().includes(f);
            })
        );
      rows.forEach(r => this.selectionManager.setRowSelected(r, enhance));
      this.selectionManager.updateSelection()
      this.tableApi?.repaint();
    }
  }

  private calcSelectionLabelData(selectedRows: FileItemIf[]) {
    const selectionLabelData: SelectionEvent = this.gridSelectionCountService
      .getSelectionCountData(
        selectedRows,
        this.bodyAreaModel?.getFilteredRows() ?? []
      );
    this.selectionLabelDataChanged.next(selectionLabelData);
  }

  private calcButtonStates<T>(selectedRows: FileItemIf[]) {
    if (this.dirPara?.path && this.initialized) {
      this.selectionLocalStorage.persistSelection(this.panelIndex, this.dirPara.path, this.selectionManager);
    }
    this.calcSelectionLabelData(selectedRows);

    let rows: FileItemIf[] = [...selectedRows];
    if (rows.length === 0
      && this.bodyAreaModel.getFocusedRowIndex() > -1
      && this.bodyAreaModel.getFocusedRowIndex() < this.bodyAreaModel.getRowCount()) {
      const rowByIndex = this.bodyAreaModel.getRowByIndex(this.bodyAreaModel.getFocusedRowIndex());
      if (rowByIndex.base !== DOT_DOT) {
        rows = [rowByIndex];
      }
    }
    this.buttonStatesChanged.next(this.getButtonEnableStates(rows));
  }

  private handleRelevantDirEvent(dirEvent: DirEventIf, zi: ZipUrlInfo) {
    if (!this.tableApi || !dirEvent || !this.dirPara) return;

    if (dirEvent.action === "list") {
      this.handleDirEventList(dirEvent, zi, this.dirPara.path);

    } else if (dirEvent.action === "add" || dirEvent.action === "addDir") {
      this.addRows(dirEvent);

    } else if (dirEvent.action === "checkOrAddDir" || dirEvent.action === "checkOrAddFile") {
      const exists: boolean = this.tableApi
        .findRows(
          dirEvent.items,
          equalFileItem
        ).length > 0;

      if (!exists) {
        this.addRows(dirEvent);
      }

    } else if (dirEvent.action === "unlink" || dirEvent.action === "unlinkDir") {

      this.tableApi.removeRows(dirEvent.items, equalFileItem);
      this.bodyAreaModel.setFocusedRowIndex(Math.min(this.bodyAreaModel.getRowCount() - 1, this.bodyAreaModel.getFocusedRowIndex()));

      this.tableApi.externalFilterChanged();
      this.tableApi.reSort();

      this.repaintTable();
      this.selectionManager.updateSelection();

    } else if (dirEvent.action === "change") {
      this.tableApi.updateRows(dirEvent.items, equalFileItem);
      this.repaintTable();

    } else if (dirEvent.action === "focus") {
      const focusRowCriterea = dirEvent.items[0];
      this.focusLocalStorage.persistFocusCriteria(this.panelIndex, this.dirPara?.path, focusRowCriterea);
      this.focusLocalStorage.applyFocus(this.panelIndex, this.dirPara?.path, this.bodyAreaModel);
      this.repaintTable();

    } else if (dirEvent.action === "unselect") {
      this.tableApi
        .findRows(dirEvent.items, equalFileItem)
        .forEach(r => {
          this.setFileItemSelected(r, false);
          this.selectionManager.setRowSelected(r, false);
        });
      this.selectionManager.updateSelection();
      this.repaintTable();

    } else if (dirEvent.action === "unselectall") {
      this.bodyAreaModel
        .getAllRows()
        .forEach(r => this.setFileItemSelected(r, false));
      this.selectionManager.clear();
      this.selectionManager.updateSelection();
      this.repaintTable();

    } else if (dirEvent.action === "select") {
      this.tableApi
        .findRows(dirEvent.items, equalFileItem)
        .forEach(r => {
          this.setFileItemSelected(r, true);
          this.selectionManager.setRowSelected(r, true);
        });
      this.selectionManager.updateSelection();
      this.repaintTable();

    } else {
      console.warn("Unknown dir changedir action:", dirEvent);
    }
  }

  private handleDirEventList(dirEvent: DirEventIf, zi: ZipUrlInfo, panelPath: string) {
    let rows: FileItemIf[] = [];

    if (!dirEvent.end) {
      rows = [...this.bodyAreaModel.getAllRows()];
    }
    if (dirEvent.items) {
      rows = [...rows,
        ...dirEvent.items.filter(fi => (
          fi.dir === panelPath
          || panelPath.startsWith('tabfind')
          || isSameDir(fi.dir, panelPath ?? '')
          || isRoot(fi.dir) && isRoot(zi.zipInnerUrl))
        )];
    }
    if (!isRoot(panelPath)
      && !panelPath.startsWith('tabfind')
      && !rows.find(r => r.base === DOT_DOT)
    ) {
      // Adding '..' as the first item (parent dir):
      rows = [
        new FileItem(getParent(panelPath), DOT_DOT, "", "", 1, true),
        ...rows
      ];
    }

    if (this.tableApi) {
      this.setRows(rows);

      const selectionLabelData: SelectionEvent = this.gridSelectionCountService
        .getSelectionCountData(
          [],
          this.bodyAreaModel?.getFilteredRows() ?? []
        );
      this.selectionLabelDataChanged.next(selectionLabelData);
    }

    if (dirEvent.end) {
      //
    }
  }

  private addRows(dirEvent: DirEventIf) {
    if (!this.tableApi || !dirEvent || !this.dirPara) return;

    this.tableApi.addRows(dirEvent.items);
    this.bodyAreaModel.getAllRows().sort(fileItemSorter);

    this.tableApi.externalFilterChanged();
    this.tableApi.reSort();

    this.repaintTable();
    this.selectionManager.updateSelection();
  }

  private setFileItemSelected(fileItem: FileItemIf, selected: boolean) {
    if (!fileItem.meta) {
      fileItem.meta = new FileItemMeta();
      fileItem.meta.selected = selected;
    }
  }

  // private updateFocusIndexByCriteria() {
  //   if (this.focusRowCriterea) {
  //     const rowIndex = this.bodyAreaModel.getRowIndexByCriteria(this.focusRowCriterea);
  //     this.setFocus2Index(rowIndex ?? 0);
  //   }
  // }

  private setRows(fileItems: FileItemIf[]): void {
    if (this.tableApi) {
      this.tableApi.setRows(fileItems);
      this.tableApi.externalFilterChanged();
      this.tableApi.reSort();

      if (this.dirPara?.path) {
        this.selectionLocalStorage?.applySelection(this.panelIndex, this.dirPara?.path, this.selectionManager);
        this.focusLocalStorage.applyFocus(this.panelIndex, this.dirPara?.path, this.bodyAreaModel);
      }

      this.tableApi.repaintHard();
    }
  }

  private repaintTable() {
    if (this.tableApi) {
      this.tableApi.externalFilterChanged();
      this.tableApi.reSort();
      this.tableApi.repaintHard();
      this.tableApi.ensureRowIsVisible(this.bodyAreaModel.getFocusedRowIndex());
    }
  }

  private getDisplayedRowCount(): number {
    if (this.tableApi) return this.tableApi.getDisplayedRowCount();
    return 10;
  }

  private changeDir(fileItem: FileItemIf) {
    if (!fileItem) {
      return; // skip
    }
    if (fileItem.isDir) {

      // update focus criteria:
      // if (fileItem.base === DOT_DOT) {
      //   const p = getParentDir(this.dirPara?.path ?? '');
      //   this.focusRowCriterea = {dir: p.dir, base: p.base};
      //   this.appService.updateFocusRowCriterea(this.panelIndex, this.focusRowCriterea);
      // } else {
      //   this.focusRowCriterea = {dir: fileItem.dir, base: DOT_DOT};
      //   this.appService.updateFocusRowCriterea(this.panelIndex, this.focusRowCriterea);
      // }

      if (fileItem.base === DOT_DOT) {
        this.changeDirNext(fileItem.dir);
      } else {
        this.changeDirNext(fileItem.dir + '/' + fileItem.base);
      }
    } else if (isZipBase(fileItem.base)) {
      // wir navigieren in ein zip-File hinein:
      const path = fileItem.dir + "/" + fileItem.base + ":";
      this.changeDirNext(path);

    } else if (isZipUrl(fileItem.dir)) {
      // wir navigieren in einem zip-File:
      const path = fileItem.dir + "/" + fileItem.base;
      this.changeDirNext(path);
    }
  }

  private changeDirNext(path: string) {
    while (this.cancellings.length > 0) {
      const id = this.cancellings.pop();
      if (id) {
        this.walkdirService.cancelWalkDir(id);
      }
    }
    this.appService.changeDir(new ChangeDirEvent(this._panelIndex, path));
  }

  private isRelevantDir(f1: string, f2: string, zi: ZipUrlInfo): boolean {
    const sd = isSameDir(f1, f2);
    if (sd) return true;
    return isSameDir(f1, zi.zipUrl + ":");
  }

  // private scrollToFocus() {
  //   if (this.tableApi) {
  //     this.tableApi.ensureRowIsVisible(this.bodyAreaModel.getFocusedRowIndex());
  //   }

  private filterFn(value: FileItemIf, _index: number, _array: FileItemIf[]): boolean {
    if (value.base === DOT_DOT) return true;
    return (!this.filterActive || value.base.toLowerCase().includes(this.filterText.toLowerCase()))
      && (this.hiddenFilesVisible || !value.base.startsWith('.'))
      ;
  }

  private onFocusChanged(focusRowIndex: number) {
    this.tableApi?.ensureRowIsVisible(focusRowIndex);
  }

}
