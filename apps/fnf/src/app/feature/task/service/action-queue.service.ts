import {Injectable} from '@angular/core';
import {QueueActionEvent} from '../domain/queue-action-event';
import {QueueActionEventType} from '../domain/queue-action-event.type';
import {Observable} from 'rxjs';
import {QueueProgress} from "../domain/queue-progress";
import {QueueIf} from "../domain/queue.if";
import {Queue} from "../domain/queue";
import {FileActionService} from "./file-action.service";
import {DirEvent, DirEventIf, OnDoResponseType} from "@fnf-data";
import {NotifyService} from "./notify-service";
import {QueueNotifyEvent} from "../domain/queue-notify-event";

@Injectable({
  providedIn: 'root'
})
export class ActionQueueService {

  // Events
  public static readonly REFRESH_JOB_QUEUE_TABLE: QueueActionEventType = 'refresh_job_queue_table';
  public static readonly OPEN_JOB_QUEUE_TABLE: QueueActionEventType = 'open_job_queue_table';


  // Action Event Keys
  readonly ACTION_REFRESH_PANEL: QueueActionEventType = 'refresh_panel';
  readonly ACTION_MKDIR: QueueActionEventType = 'mkdir';
  readonly ACTION_PACK: QueueActionEventType = 'pack';
  readonly ACTION_CREATE_FILE: QueueActionEventType = 'createfile';
  readonly ACTION_OPEN: QueueActionEventType = 'open';
  readonly ACTION_COPY: QueueActionEventType = 'copy';
  readonly ACTION_MOVE: QueueActionEventType = 'move';
  readonly ACTION_REMOVE: QueueActionEventType = 'remove';
  readonly ACTION_DELEMPTY: QueueActionEventType = 'delempty';
  readonly ACTION_RENAME: QueueActionEventType = 'rename';

  private queues: QueueIf[] = [];
  private jobId = 0;
  private refreshQueueTableTimer: any;


  constructor(
    private readonly fileActionService: FileActionService,
    private readonly eventService: NotifyService
  ) {
  }

  /**
   * Gets a queue by index, creating a new one if necessary
   * @param queueIndex The index of the queue to get
   */
  getQueue(queueIndex: number = 0): QueueIf {
    if (queueIndex > this.queues.length) {
      throw new Error(`Error: getQueue(queueIndex) queueIndex is ${queueIndex} but queues.length is ${this.queues.length}!`);
    }
    if (queueIndex === this.queues.length) {
      // Auto add new queue:
      this.addNewQueue();
    }
    return this.queues[queueIndex];
  }



  getQueueProgress(queueIndex: number = 0): QueueProgress {
    return this.getQueue(queueIndex).progress;
  }


  /**
   * Adds multiple actions to a queue
   * @param actionEvents The actions to add
   * @param queueIndex The index of the queue to add the actions to
   */
  addActions(actionEvents: QueueActionEvent[], queueIndex: number = 0): void {
    this.jobId++;
    const queue = this.getQueue(queueIndex);
    queue.jobId = this.jobId;
    for (let i = 0; i < actionEvents.length; i++) {
      const actionEvt = actionEvents[i];
      actionEvt.status = "PENDING";
      actionEvt.id = this.jobId;
      actionEvt.size = 0;

      // for long-running actions 'move' and 'copy' we store the size of the source file/folder in the action event:
      if (actionEvt.action === this.ACTION_MOVE || actionEvt.action === this.ACTION_COPY) {
        actionEvt.size = actionEvt.filePara?.source?.size ?? 0;
      }
      queue.actions.push(actionEvt);
    }
    this.triggerJobQueueTableUpdate();
    this.triggerProgress();
  }

  /**
   * Processes the next action in a queue
   * @param queue The queue to process
   */
  next(queue: QueueIf = this.getQueue(0)): void {
    if (queue.status==='PAUSED') return;

    for (let i = 0; i < queue.actions.length; i++) {
      const actionEvent: QueueActionEvent = queue.actions[i];
      if (actionEvent.status === "PENDING") {
        queue.status = 'RUNNING';
        actionEvent.status = "PROCESSING";

        if (actionEvent.action === this.ACTION_REFRESH_PANEL) {
          actionEvent.status = "SUCCESS";

          this.eventService.next(
            new QueueNotifyEvent(
              this.ACTION_REFRESH_PANEL,
              [
                {...new DirEvent('', []), panelIndex: actionEvent.panelIndex}
              ]));
          this.triggerJobQueueTableUpdate();


        } else {

          actionEvent.startTime = Date.now();
          this.executeAction(actionEvent)
            .subscribe({
              next: (res: OnDoResponseType) => {
                console.log(' executeAction next res:', res);
                queue.status = "IDLE"
                actionEvent.status = "SUCCESS";
                actionEvent.duration = Date.now() - actionEvent.startTime;

                const dea: DirEventIf[] = res;
                for (let j = 0; j < dea.length; j++) {
                  const dirEvent = dea[j];
                  if (dirEvent.action === 'reload') {
                    this.eventService.next(
                      new QueueNotifyEvent(
                        'reload',
                        [
                          {...dirEvent}
                        ]));
                  }
                }

                this.eventService.next({
                  type: actionEvent.action,
                  data: res
                });
                this.next(queue);
                this.triggerJobQueueTableUpdate();
              },
              error: (err) => {
                queue.status = 'ERROR';
                actionEvent.status = "ERROR";
                this.triggerJobQueueTableUpdate();
              }
            });
          return; // leave the for loop
        }
      }
    }
    queue.status = "IDLE"
    this.triggerJobQueueTableUpdate();
  }

  /**
   * Gets an observable for a specific event type
   * @param eventType The type of event to listen for
   */
  onEvent(eventType: string): Observable<OnDoResponseType> {
    return new Observable<OnDoResponseType>((observer) => {
      const subscription =
        this.eventService
          .valueChanges()
          .subscribe((event) => {
            if (event && event.type === eventType) {
              observer.next(event.data);
            }
          });

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  openJobTable() {
    this.eventService.next(new QueueNotifyEvent(ActionQueueService.OPEN_JOB_QUEUE_TABLE, []));
  }

  removeSuccessed(queueIndex: number = 0) {
    const queue = this.getQueue(queueIndex);
    queue.actions = queue.actions.filter(action => action.status !== "SUCCESS");
  }

  removePendingActionEvents(queueIndex: number = 0) {
    const queue = this.getQueue(queueIndex);
    queue.actions = queue.actions.filter(action => action.status !== "PENDING");
  }

  doPause(queueIndex: number = 0) {
    const queue = this.getQueue(queueIndex);
    queue.status = 'PAUSED';
  }

  // isPause(queueIndex: number = 0) {
  //   return this.getQueue(queueIndex).status==='PAUSED';
  // }

  doResume(queueIndex: number = 0) {
    const queue = this.getQueue(queueIndex);
    queue.status = 'IDLE';
    this.triggerProgress();
  }

  removeAction(actionId: number) {
    const queue = this.getQueue(0);
    const actionIndex = queue.actions.findIndex(a => a.id === actionId);
    
    if (actionIndex !== -1) {
      const action = queue.actions[actionIndex];
      if (action.status === 'PROCESSING') {
        return; // Can't remove running actions
      }
      
      queue.actions.splice(actionIndex, 1);
      this.eventService.next(new QueueNotifyEvent('remove', []));
      this.triggerProgress();
    }
  }

  /**
   * Adds a new queue to the list of queues
   * @private
   */
  private addNewQueue(): void {
    this.queues.push(new Queue({
      status: "IDLE"
    }));
  }

  /**
   * Calculates the progress of all queues
   * @private
   */
  private calcQueueProgress(): void {
    for (let queueIndex = 0; queueIndex < this.queues.length; queueIndex++) {
      const queue = this.queues[queueIndex];
      const progress = queue.progress;
      progress.unfinished = 0;
      progress.finished = 0;
      progress.errors = 0;

      const jid = queue.jobId;
      const actionEvents = queue.actions;

      for (let i = 0; i < actionEvents.length; i++) {
        const actionEvent = actionEvents[i];
        if (actionEvent.id >= jid) {
          if (actionEvent.status === "PENDING" || actionEvent.status === "PROCESSING") {
            progress.unfinished++;
          } else {
            progress.finished++;
          }
          if (actionEvent.status === "ERROR") {
            progress.errors++;
          }
        }
      }

      if (progress.finished > 0 && progress.unfinished === 0) {
        progress.class = 'font-weight-bold text-success';
      } else if (progress.unfinished > 0) {
        progress.class = 'text-info';
      } else if (progress.errors) {
        progress.class = 'font-weight-bold text-danger';
      } else {
        progress.class = 'text-muted';
      }

      queue.buttonStates.clean = progress.finished >0;
      queue.buttonStates.pause = progress.unfinished>0;
      queue.buttonStates.resume = progress.unfinished>0 && queue.status==='PAUSED';
      queue.buttonStates.stop = queue.actions.filter(a => a.status === 'PENDING').length > 0;
    }
  }


  private triggerJobQueueTableUpdate(): void {
    this.calcQueueProgress();
    if (this.refreshQueueTableTimer) {
      clearTimeout(this.refreshQueueTableTimer);
    }
    this.refreshQueueTableTimer = setTimeout(() => {
      this.eventService.next(new QueueNotifyEvent(ActionQueueService.REFRESH_JOB_QUEUE_TABLE, []));
    }, 500);
  }


  private triggerProgress(): void {
    this.calcQueueProgress();
    for (let i = 0; i < this.queues.length; i++) {
      const queue = this.queues[i];
      if (queue.status === "IDLE") {
        this.next(queue);
      }
    }
  }

  private executeAction(action: QueueActionEvent): Observable<OnDoResponseType> {
    return this.fileActionService.do(action.filePara);
  }

}
