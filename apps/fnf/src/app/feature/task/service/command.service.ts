import {Injectable} from '@angular/core';
import {QueueActionEvent} from "../domain/queue-action-event";
import {QueueActionEventType} from "../domain/queue-action-event.type";
import {
  DirEvent,
  FileItemIf,
  FileItemMeta,
  FilePara,
  OnDoResponseType,
  PanelIndex,
  UnpackParaData,
  WalkData
} from "@fnf-data";
import {ActionQueueService} from "./action-queue.service";
import {QueueFileOperationParams} from "../domain/queue-file-operation-params";
import {NotifyService} from "./notify-service";
import {QueueNotifyEventIf} from "../domain/queue-notify-event.if";
import {QueueNotifyEvent} from "../domain/queue-notify-event";
import {UnzipDialogResultData} from "../../cmd/unzip/unzip-dialog-result.data";
import {WalkdirService} from "../../../common/walkdir/walkdir.service";
import {fileItem2Path} from "../../../common/fn/file-item-to-path";

@Injectable({
  providedIn: 'root'
})
export class CommandService {

  // Constants
  public static readonly BULK_LOWER_LIMIT = 30;
  private actionId = 0;
  private walkCancelKeys: string[] = [];

  constructor(
    private readonly actionQueueService: ActionQueueService,
    private readonly eventService: NotifyService,
    private readonly walkdirService: WalkdirService,
  ) {
  }

  createActionEvent(
    key: QueueActionEventType,
    source: FileItemIf,
    target: FileItemIf,
    sourcePanelIndex: PanelIndex,
    targetPanelIndex: PanelIndex
  ): QueueActionEvent {
    const filePara = new FilePara(
      source,
      target,
      sourcePanelIndex,
      targetPanelIndex,
      key as unknown as any
    );

    return new QueueActionEvent(
      targetPanelIndex,
      filePara,
      "PENDING",
      this.actionId++
    );
  }

  createActionQueueEventWithFilePara(
    filePara: FilePara,
    bulk: boolean = false
  ): QueueActionEvent {

    const targetPanelIndex = filePara.targetPanelIndex ?? filePara.sourcePanelIndex ?? 0;

    return new QueueActionEvent(
      targetPanelIndex,
      filePara,
      "PENDING",
      this.actionId++
    );
  }

  /**
   * Refreshes a panel
   * @param panelIndex The panel index
   */
  createQueueActionEventForRefreshPanel(panelIndex: PanelIndex): QueueActionEvent {
    return this.createActionEvent(
      this.actionQueueService.ACTION_REFRESH_PANEL,
      {} as FileItemIf,
      {} as FileItemIf,
      panelIndex,
      panelIndex,
    );
  }

  /**
   * Creates a directory
   * @param para The parameters for the mkdir operation
   */
  createQueueActionEventForMkdir(para: { dir: string; base: string; panelIndex: PanelIndex }): QueueActionEvent {
    return this.createActionEvent(
      this.actionQueueService.ACTION_MKDIR,
      {} as FileItemIf,
      {dir: para.dir, base: para.base} as FileItemIf,
      para.panelIndex,
      para.panelIndex,
    );
  }

  createQueueActionEventForUnzip(para: UnzipDialogResultData): QueueActionEvent {
    const unpackPara = new UnpackParaData(
      para.source,
      para.target,
      para.password
    );

    return new QueueActionEvent(
      1, // targetPanelIndex
      unpackPara as any, // Use UnpackParaData instead of FilePara
      "PENDING",
      this.actionId++
    );
  }

  createQueueActionEventForPack(para: any): QueueActionEvent {
    return this.createActionEvent(
      this.actionQueueService.ACTION_PACK,
      para.source,
      para.target,
      0,
      1,
    );
  }

  createQueueActionEventForCreateFile(para: {
    dir: string;
    base: string;
    ext: string;
    panelIndex: PanelIndex
  }): QueueActionEvent {
    return this.createActionEvent(
      this.actionQueueService.ACTION_CREATE_FILE,
      {} as FileItemIf,
      {dir: para.dir, base: para.base, ext: para.ext} as FileItemIf,
      para.panelIndex,
      para.panelIndex,
    );
  }

  /**
   * Deletes a file or directory
   * @param para The parameters for the delete operation
   */
  createQueueActionEventForDel(para: {
    source: FileItemIf;
    srcPanelIndex: PanelIndex;
    bulk?: boolean
  }): QueueActionEvent {
    const source = para.source;
    const srcPanelIndex = para.srcPanelIndex;
    const bulk = para.bulk || false;

    if (!bulk) {
      // Send event to show a placeholder in the target table
      // this.eventService.next({
      //   type: 'update',
      //   data: {
      //     panelIndex: srcPanelIndex,
      //     item: {dir: source.dir, base: source.base, status: 'temp'}
      //   }
      // });
    }

    return this.createActionEvent(
      this.actionQueueService.ACTION_REMOVE,
      source,
      null as unknown as FileItemIf,
      srcPanelIndex,
      srcPanelIndex,
    );
  }

  /**
   * Deletes an empty directory
   * @param para The parameters for the createQueueActionEventForDelEmpty operation
   */
  createQueueActionEventForDelEmpty(para: { source: FileItemIf; srcPanelIndex: PanelIndex }): QueueActionEvent {
    return this.createActionEvent(
      this.actionQueueService.ACTION_DELEMPTY,
      para.source,
      null as unknown as FileItemIf,
      para.srcPanelIndex,
      para.srcPanelIndex,
    );
  }

  /**
   * Copies a file or directory
   * @param para The parameters for the copy operation
   */
  createQueueActionEventForCopy(para: QueueFileOperationParams): QueueActionEvent {
    const source = para.source;
    const srcPanelIndex = para.srcPanelIndex;
    const targetPanelIndex = para.targetPanelIndex;
    const target = para.target;
    const bulk = para.bulk || false;

    return this.createActionEvent(
      this.actionQueueService.ACTION_COPY,
      source,
      target,
      srcPanelIndex,
      targetPanelIndex,
    );
  }

  /**
   * Moves a file or directory
   * @param para The parameters for the move operation
   */
  createQueueActionEventForMove(para: QueueFileOperationParams): QueueActionEvent {
    const source = para.source;
    const srcPanelIndex = para.srcPanelIndex;
    const target = para.target;
    // const targetPanelIndex = para.targetPanelIndex;
    const bulk = para.bulk || false;
    return this.createActionEvent(
      this.actionQueueService.ACTION_MOVE,
      source,
      target,
      srcPanelIndex,
      para.targetPanelIndex,
    );
  }

  /**
   * Renames a file or directory
   * @param para The parameters for the rename operation
   */
  createQueueActionEventForRename(para: QueueFileOperationParams): QueueActionEvent {
    const source = para.source;
    const srcPanelIndex = para.srcPanelIndex;
    const target = para.target;
    const bulk = para.bulk || false;

    if (!bulk) {
      // Send event to show a placeholder
      if (srcPanelIndex !== undefined) {
        const item: OnDoResponseType = [
          new DirEvent(source.dir, [
            {...source, meta: new FileItemMeta('', 'temp', true)}
            //new FileItem(source.dir, source.base, '', '', 0, false, false, new FileItemMeta('', 'temp', true))
          ])];
        let o: QueueNotifyEventIf = new QueueNotifyEvent('update', item)
        this.eventService.next(o);
      }
    }

    return this.createActionEvent(
      this.actionQueueService.ACTION_RENAME,
      source,
      target,
      srcPanelIndex,
      para.targetPanelIndex,
    );
  }


  /**
   * @method addActions
   * @description Adds one or more action events to the action queue for processing
   *
   * @param {QueueActionEvent[]} actions - Array of action events to be added to the queue
   * @param {number} [queueIndex] - Optional index specifying where in the queue to add the actions
   * @param {boolean} [openJobTable=false] - Optional flag to determine if the job table should be opened after adding actions
   *
   * @returns {void}
   *
   * @remarks
   * This method is responsible for adding file operation actions to the system's action queue for processing.
   * It handles both single actions and bulk operations, with special processing for large bulk operations.
   *
   * The method will:
   * 1. Process each action in the provided array
   * 2. Add them to the action queue service at the specified index (or at the end if no index provided)
   * 3. Optionally open the job table to show progress
   *
   * For bulk operations exceeding the BULK_LOWER_LIMIT threshold, additional optimizations may be applied.
   *
   * @example
   * // Example 1: Add a single copy action to the queue
   * const copyAction = this.createQueueActionEventForCopy({
   *   source: sourceFile,
   *   target: targetFile,
   *   srcPanelIndex: 0,
   *   targetPanelIndex: 1
   * });
   * this.addActions([copyAction]);
   *
   * @example
   * // Example 2: Add multiple delete actions with job table display
   * const deleteActions = selectedFiles.map(file =>
   *   this.createQueueActionEventForDel({
   *     source: file,
   *     srcPanelIndex: 0,
   *     bulk: true
   *   })
   * );
   * this.addActions(deleteActions, undefined, true);
   *
   * @example
   * // Example 3: Add refresh actions at the beginning of the queue
   * const refreshActions = this.createRefreshesActionEvents([0, 1]);
   * this.addActions(refreshActions, 0);
   */
  addActions(actions: QueueActionEvent[], queueIndex: number = 0, openJobTable: boolean = true): void {
    actions
      .forEach(action => {
        if (['move', 'copy'].includes(action.action) && action.filePara.source?.isDir) {
          const cancelKey = this.walkdirService
            .walkDir(
              [fileItem2Path(action.filePara.source)],
              '**/*',
              (walkData: WalkData) => {
                if (action.filePara.source) {
                  action.filePara.source.size = walkData.sizeSum;
                  action.size = walkData.sizeSum;
                }
              });
          this.walkCancelKeys.push(cancelKey);
        }
      });

    this.actionQueueService.addActions(actions, queueIndex);
    if (queueIndex === 0 && openJobTable) {
      this.actionQueueService.openJobTable();
    }
  }


  createQueueActionEventForOpen(para: QueueFileOperationParams): QueueActionEvent {
    const source = para.source;
    const srcPanelIndex = para.srcPanelIndex;
    const target = para.target;

    return this.createActionEvent(
      this.actionQueueService.ACTION_OPEN,
      source,
      target,
      srcPanelIndex,
      para.targetPanelIndex,
    );
  }

  createRefreshesActionEvents(indicees: PanelIndex[]): QueueActionEvent[] {
    return indicees.map(index => this.createQueueActionEventForRefreshPanel(index));
  }
}
