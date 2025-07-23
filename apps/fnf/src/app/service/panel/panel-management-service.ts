import {Injectable} from "@angular/core";
import {TabsPanelDataService} from "../../domain/filepagedata/tabs-panel-data.service";
import {PanelSelectionService} from "../../domain/filepagedata/service/panel-selection.service";
import {combineLatest, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {PanelIndex} from "@fnf/fnf-data";
import {TabsPanelData} from "../../domain/filepagedata/data/tabs-panel.data";
import {TabData} from "../../domain/filepagedata/data/tab.data";


@Injectable({
  providedIn: 'root'
})
export class PanelManagementService {

  public MAX_HISTORY_LENGTH = 15;
  readonly panelIndices: PanelIndex[] = [0, 1];

  constructor(
    private readonly tabsPanelDataService: TabsPanelDataService,
    private readonly panelSelectionService: PanelSelectionService,
  ) {
  }

  debug() {
    console.info('tabsPanelData 0\n', this.getTabsPanelData(0));
    console.info('tabsPanelData 1\n', this.getTabsPanelData(1));
  }

  getPanelIndices(): PanelIndex[] {
    return this.panelIndices;
  }


  /**
   * Retrieves a unique list of history entries from all tabs across all panels.
   *
   * This method observes changes in the file page data and processes the history
   * entries from all tabs in both panels. It eliminates duplicate entries to
   * provide a consolidated history list.
   *
   * The method works by:
   * 1. Subscribing to file page data changes
   * 2. Extracting history entries from each tab in each panel
   * 3. Removing duplicate entries from the combined history
   *
   * @returns An Observable that emits an array of unique history entries (paths)
   *
   * @example
   * // Subscribe to history changes
   * this.getAllHistories$().subscribe(histories => {
   *   console.log('Current unique histories:', histories);
   *   // Example output: ['/home/user', '/usr/local', '/etc']
   * });
   *
   * // Using with async pipe in template
   * @Component({
   *   template: `
   *     <ul>
   *       <li *ngFor="let history of getAllHistories$() | async">
   *         {{ history }}
   *       </li>
   *     </ul>
   *   `
   * })
   *
   * @usageNotes
   * - The history entries are typically file system paths that have been visited
   * - The method automatically handles updates when tabs are added, removed, or modified
   * - Duplicate entries are automatically removed, keeping only the first occurrence
   * - The returned Observable continues to emit new values whenever the file page data changes
   */
  getAllHistories$(): Observable<string[]> {
    return combineLatest([
      this.tabsPanelDataService.valueChanges(0),
      this.tabsPanelDataService.valueChanges(1)
    ])
      .pipe(
        map(tabsPanelDatas => {
          const ret: string[] = [];
          tabsPanelDatas.map(tabsPanelData => {
            tabsPanelData.tabs.forEach(tab => {
              ret.push(tab.path);
              ret.push(...tab.history);
            });
          });
          return ret;
        }),
        map(histories => histories.filter((his, i, arr) =>
          his &&
          arr.indexOf(his) === i &&
          !his.startsWith('tabfind')
        ))
      );
  }

  getAllHistories(): string[] {
    const ret: string[] = [];
    [
      this.tabsPanelDataService.getValue(0),
      this.tabsPanelDataService.getValue(1),
    ].forEach(panelData => {
      panelData.tabs.forEach((tab) => {
        ret.push(...tab.history);
      })
    })
    return ret.filter((his, i, arr) => arr.indexOf(his) === i);
  }

  filePageDataChange$(panelIndex: PanelIndex): Observable<TabsPanelData> {
    return this.tabsPanelDataService.valueChanges(panelIndex);
  }


  getTabsPanelData(panelIndex: PanelIndex): TabsPanelData {
    return this.tabsPanelDataService.getValue(panelIndex)
  }

  updateTabsPanelData(panelIndex: PanelIndex, fileData: TabsPanelData) {
    let clone = this.clone(fileData);
    this.tabsPanelDataService.update(panelIndex, clone);
  }


  getActiveTabOnActivePanel(): TabData {
    const pi = this.getActivePanelIndex();
    const tabsPanelData = this.tabsPanelDataService.getValue(pi);
    return tabsPanelData.tabs[tabsPanelData.selectedTabIndex];
  }


  setPanelActive(panelIndex: PanelIndex) {
    this.panelSelectionService.update(panelIndex);
  }

  getActivePanelIndex(): PanelIndex {
    return this.panelSelectionService.getValue();
  }

  getInactivePanelIndex(): PanelIndex {
    return [1, 0][this.getActivePanelIndex()] as PanelIndex;
  }

  getOtherPanelSelectedTabData(): TabData {
    const inactivePanelIndex = ([1, 0][this.getActivePanelIndex()]) as PanelIndex;
    const panelData: TabsPanelData = this.getTabsPanelData(inactivePanelIndex);
    return panelData.tabs[panelData.selectedTabIndex];
  }


  getPanelSelectionChange$(): Observable<PanelIndex> {
    return this.panelSelectionService.valueChanges$();
  }

  togglePanelSelection() {
    this.panelSelectionService.toggle();
  }

  getDirsFromAllTabs(): string[] {
    const ret: string[] = [];

    const tabPanelDatas = [
      this.getTabsPanelData(0),
      this.getTabsPanelData(1),
    ];
    for (const tabRow of tabPanelDatas) {
      for (const tab of tabRow.tabs) {
        if (!ret.includes(tab.path)) {
          ret.push(tab.path);
        }
      }
    }
    return ret;
  }

  removeTab() {
    const panelIndex = this.getActivePanelIndex();
    const tabsPanelData = this.getTabsPanelData(panelIndex);

    if (tabsPanelData.tabs.length > 1) {
      const selectedTabIndex = tabsPanelData.selectedTabIndex;
      tabsPanelData.tabs.splice(selectedTabIndex, 1);
      tabsPanelData.selectedTabIndex = Math.min(tabsPanelData.tabs.length - 1, selectedTabIndex);
      this.updateTabsPanelData(panelIndex, tabsPanelData);
    }
  }

  public addTab(panelIndex: PanelIndex, tabData: TabData) {
    const tabsPanelData = this.getTabsPanelData(panelIndex);
    tabsPanelData.tabs.push(tabData);
    tabsPanelData.selectedTabIndex = tabsPanelData.tabs.length - 1;
    this.updateTabsPanelData(panelIndex, tabsPanelData);
  }

  addNewTab() {
    const panelIndex = this.getActivePanelIndex();
    const tabsPanelData = this.getTabsPanelData(panelIndex);
    const tabData = tabsPanelData.tabs[tabsPanelData.selectedTabIndex];
    tabsPanelData.tabs.push(this.clone(tabData));
    tabsPanelData.selectedTabIndex = tabsPanelData.tabs.length - 1;
    this.updateTabsPanelData(panelIndex, tabsPanelData);
  }

  setPathToActiveTabInGivenPanel(path: string, panelIndex: PanelIndex, skipNextHistoryChange: boolean) {

    console.info('setPathToActiveTabInGivenPanel ' + panelIndex, path);
    if (path.startsWith('tabfind')) {
      console.warn('setPathToActiveTabInGivenPanel: tabfind not supported yet');
    }
    let checkedPath = path;
    const panelData: TabsPanelData = this.getTabsPanelData(panelIndex);
    const tabData: TabData = panelData.tabs[panelData.selectedTabIndex];
    tabData.path = checkedPath;
    tabData.findData = undefined;

    if (!skipNextHistoryChange) {
      // add checkedPath on top:
      tabData.history.splice(0, 0, checkedPath);
      // remove double items:
      tabData.history = tabData.history.filter((his, i, arr) => arr.indexOf(his) === i);
      // max count = 10:
      if (tabData.history.length > this.MAX_HISTORY_LENGTH) {
        tabData.history.length = this.MAX_HISTORY_LENGTH;
      }
    }
    // update ui:
    this.updateTabsPanelData(panelIndex, panelData);
  }

  private clone<T>(o: T): T {
    return JSON.parse(JSON.stringify(o));
  }
}