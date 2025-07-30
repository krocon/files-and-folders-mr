import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {ActionQueueService} from "../service/action-queue.service";
import {NotifyService} from "../service/notify-service";
import {QueueNotifyEventIf} from "../domain/queue-notify-event.if";
import {StatusIconType} from "../../common/status-icon.type";
import {QueueProgress} from "../domain/queue-progress";
import {BusyBeeComponent} from "../../common/busy-bee.component";
import {QueueIf} from "../domain/queue.if";
import {
  isQueueItemPending,
  isQueueItemRunning,
  isQueuePaused,
  isQueueRunning,
  QueueItemStatus,
  QueueStatus
} from "@fnf-data";
import {QueueActionEvent} from "../domain/queue-action-event";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FnfConfirmationDialogService} from "../../../common/confirmationdialog/fnf-confirmation-dialog.service";
import {CommonModule} from "@angular/common";
import {TaskListCalculationService} from "../service/task-list-calculation.service";
import {DurationFormatPipe} from "./duration-format.pipe";
import {FnfCountupComponent} from "../../../common/countdown/fnf-countup.component";

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    BusyBeeComponent,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    DurationFormatPipe,
    FnfCountupComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent implements OnInit, OnDestroy {
  /*
  Schritt 1:
  Wenn ein QueueActionEvent der Queue übergeben wird mit 'move' oder 'copy', so muss die Dateigröße (im Falle eines Folders die Summe der Größen) in QueueActionEvent.size gespeichert werden.

Schritt 2:
   Die beiden Queue cmds 'move' und 'copy' brauchen oft viel Zeit.
   Bitte implementiere eine Restzeit-Schätzung, die als Countdown im div.header (rechts oben) dargestellt wird (mm:ss).
   Achte auf die Performance und runOutsideAngular.
   Die Restzeit-Schätzung sollte die File-Größen berücksichtigen.
   Wenn die Queue am Laufen ist, korrigiere periodisch die Schätzung (alle 20 Sekunden).
   Rendere die Zeit als element.innerText='mm:ss' jede Sekunde, ohne angular zu nutzen.
   Eventuell kannst du die Berechnung in einem Service kapseln (apps/fnf/src/app/component/task/task-list-calculation.service.ts)).
   Wenn die Queue fertig ist (idle), dann setze die Zeitanzeige auf ''.
   Wenn die Queue pausiert, dann zeige die letzte Zeitanzeige.
   */
  queue: QueueIf;
  queueProgress: QueueProgress;
  status: StatusIconType = 'idle';
  infoText: string = '';

  @ViewChild('remainingTime', {static: true}) remainingTimeElement!: ElementRef<HTMLElement>;

  private _bottomSheetRef =
    inject<MatBottomSheetRef<TaskListComponent>>(MatBottomSheetRef);

  constructor(
    private readonly actionQueueService: ActionQueueService,
    private readonly notifyService: NotifyService,
    private readonly confirmationService: FnfConfirmationDialogService,
    private readonly calculationService: TaskListCalculationService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.queueProgress = actionQueueService.getQueueProgress(0);
    this.queue = actionQueueService.getQueue(0);
  }

  ngOnDestroy(): void {
    this.calculationService.stopTracking();
  }

  ngOnInit(): void {
    this.notifyService
      .valueChanges()
      .subscribe(
        (evt: QueueNotifyEventIf) => {
          this.updateUi();
        }
      );
    // Start tracking remaining time
    this.calculationService.startTracking(this.remainingTimeElement.nativeElement);
  }


  getBeeStatus(status: string): StatusIconType {
    if (isQueueItemPending(status as QueueItemStatus)) return 'idle';
    if (isQueueItemRunning(status as QueueItemStatus)) return 'busy';
    if (status === 'SUCCESS') return 'success';
    if (status === 'ERROR') return 'error';
    return 'idle';
  }

  apiUrlName(action: QueueActionEvent) {
    if (action?.filePara) {
      if (action.filePara.target?.base) return action.filePara.target?.base;
      if (action.filePara.source?.base) return action.filePara.source?.base;
      if (action.filePara.target?.dir) return action.filePara.target?.dir;
      if (action.filePara.source?.dir) return action.filePara.source?.dir;
    }
    return "";
  }

  onRemoveSuccessedClicked() {
    this.actionQueueService.removeSuccessed();
  }

  onDeleteAllClicked() {
    this.confirmationService.simpleConfirm(
      'Stop all pending tasks',
      'Are you sure you want to remove all pending tasks?',
      () => {
        this.actionQueueService.removePendingActionEvents();
        this.cdr.detectChanges();
      }
    );
  }

  onPauseNextClicked() {
    this.actionQueueService.doPause();
    this.cdr.detectChanges();
  }

  onResumeClicked() {
    this.actionQueueService.doResume();
    this.cdr.detectChanges();
  }

  async onDeleteItemClicked(action: QueueActionEvent) {
    const confirmed = await this.confirmationService.simpleConfirm(
      'Delete Task',
      `Are you sure you want to delete the ${action.filePara.cmd.toLowerCase()} task for "${this.apiUrlName(action)}"?`,
      () => {
        this.actionQueueService.removeAction(action.id);
        this.cdr.detectChanges();
      }
    );
  }

  canDeleteItem(action: QueueActionEvent): boolean {
    return !isQueueItemRunning(action.status as QueueItemStatus);
  }

  private updateUi() {
    this.queueProgress = this.actionQueueService.getQueueProgress(0);
    this.infoText = this.queueProgress.finished + ' / ' + (this.queueProgress.finished + this.queueProgress.unfinished);

    // Update remaining time calculation
    this.calculationService.updateQueue(this.queue.actions, this.queue.status as QueueStatus);

    // Update status based on queue state and progress
    let status: StatusIconType = 'idle';
    if (isQueueRunning(this.queue.status as QueueStatus)) {
      status = this.queueProgress.errors ? 'error' : 'busy';
    } else if (isQueuePaused(this.queue.status as QueueStatus)) {
      status = 'idle';
    } else if (this.queue.status === 'ERROR') {
      status = 'error';
    }

    this.status = status;
    this.cdr.detectChanges();
  }
}
