import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {MatBottomSheetRef} from "@angular/material/bottom-sheet";
import {ActionQueueService} from "../../../service/cmd/action-queue.service";
import {NotifyService} from "../../../service/cmd/notify-service";
import {QueueNotifyEventIf} from "../../../domain/cmd/queue-notify-event.if";
import {StatusIconType} from "../../common/status-icon.type";
import {QueueProgress} from "../../../domain/cmd/queue-progress";
import {BusyBeeComponent} from "../../common/busy-bee.component";
import {QueueIf} from "../../../domain/cmd/queue.if";
import {QueueStatus, canQueueResume, isQueueRunning, isQueuePaused} from "@fnf-data";
import {QueueItemStatus, isQueueItemFinished, isQueueItemRunning, isQueueItemPending} from "@fnf-data";
import {QueueActionEvent} from "../../../domain/cmd/queue-action-event";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FnfConfirmationDialogService} from "../../../common/confirmationdialog/fnf-confirmation-dialog.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    BusyBeeComponent,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent implements OnInit {
  /*

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

  private _bottomSheetRef =
    inject<MatBottomSheetRef<TaskListComponent>>(MatBottomSheetRef);

  constructor(
    private readonly actionQueueService: ActionQueueService,
    private readonly notifyService: NotifyService,
    private readonly confirmationService: FnfConfirmationDialogService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.queueProgress = actionQueueService.getQueueProgress(0);
    this.queue = actionQueueService.getQueue(0);
  }

  ngOnInit(): void {
    this.notifyService
      .valueChanges()
      .subscribe(
        (evt: QueueNotifyEventIf) => {
          this.updateUi();
        }
      )
  }

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }

  getBeeStatus(status: string): StatusIconType {
    if (isQueueItemPending(status as QueueItemStatus)) return 'idle';
    if (isQueueItemRunning(status as QueueItemStatus)) return 'busy';
    if (status === 'SUCCESS') return 'success';
    if (status === 'ERROR' || status === 'WARNING') return 'error';
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
      'Stop All Tasks',
      'Are you sure you want to stop and remove all tasks?',
      () => this.actionQueueService.doStop()
    );
  }

  onPauseNextClicked() {
    this.actionQueueService.doPause();
  }

  onResumeClicked() {
    this.actionQueueService.doResume();
  }

  async onDeleteItemClicked(action: QueueActionEvent) {
    const confirmed = await this.confirmationService.simpleConfirm(
      'Delete Task',
      `Are you sure you want to delete the ${action.filePara.cmd.toLowerCase()} task for "${this.apiUrlName(action)}"?`,
      () => this.actionQueueService.removeAction(action.id)
    );
  }

  canDeleteItem(action: QueueActionEvent): boolean {
    return !isQueueItemRunning(action.status as QueueItemStatus);
  }

  private updateUi() {
    this.queueProgress = this.actionQueueService.getQueueProgress(0);
    this.infoText = this.queueProgress.finished + ' / ' + (this.queueProgress.finished + this.queueProgress.unfinished);

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
