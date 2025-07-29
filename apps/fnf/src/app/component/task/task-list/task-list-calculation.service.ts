import {Injectable, NgZone} from '@angular/core';
import {isQueuePaused, isQueueRunning, QueueStatus} from "@fnf-data";
import {QueueActionEvent} from "../../../domain/cmd/queue-action-event";

interface TimeEstimate {
  totalBytes: number;
  processedBytes: number;
  startTime: number;
  bytesPerSecond: number;
  lastUpdateTime: number;
}

@Injectable({providedIn: 'root'})
export class TaskListCalculationService {

  private estimates: Map<string, TimeEstimate> = new Map();
  private updateInterval: any;
  private renderInterval: any;
  private targetElement: HTMLElement | null = null;
  private lastDisplayedTime: string = '';


  constructor(
    private readonly ngZone: NgZone
  ) {
  }

  startTracking(element: HTMLElement) {
    this.targetElement = element;
    this.stopTracking(); // Clear any existing intervals

    // Run calculations outside Angular
    this.ngZone.runOutsideAngular(() => {
      // Update estimation every 20 seconds
      this.updateInterval = setInterval(() => this.updateEstimates(), 20000);

      // Render countdown every second
      this.renderInterval = setInterval(() => this.renderCountdown(), 1000);
    });
  }

  stopTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.renderInterval) {
      clearInterval(this.renderInterval);
      this.renderInterval = null;
    }
  }

  updateQueue(actions: QueueActionEvent[], queueStatus: QueueStatus) {
    if (!isQueueRunning(queueStatus)) {
      if (isQueuePaused(queueStatus)) {
        // Keep showing last time during pause
        this.renderTime(this.lastDisplayedTime);
      } else {
        // Clear time for other states
        this.renderTime('');
      }
      return;
    }

    const now = Date.now();

    // Process each action
    actions.forEach(action => {
      if (action.filePara.cmd !== 'copy' && action.filePara.cmd !== 'move') return;

      const key = `${action.id}`;
      const existing = this.estimates.get(key);

      if (!existing && action.status === 'PROCESSING') {
        // New processing action
        this.estimates.set(key, {
          totalBytes: action.filePara.source?.size || 0,
          processedBytes: 0,
          startTime: now,
          bytesPerSecond: 0,
          lastUpdateTime: now
        });
      } else if (existing) {
        if (action.status === 'SUCCESS' || action.status === 'ERROR') {
          this.estimates.delete(key);

        } else if (action.filePara?.source?.size) {

          let size = action.filePara?.source?.size;
          let processedBytes = ['ERROR', 'WARNING', 'SUCCESS', 'ABORT'].includes(action.status) ? size : 0;
          // Update processed bytes and calculate speed
          const timeDiff = (now - existing.lastUpdateTime) / 1000; // seconds
          const bytesDiff = processedBytes - existing.processedBytes;

          if (timeDiff > 0) {
            existing.bytesPerSecond = bytesDiff / timeDiff;
            existing.processedBytes = processedBytes;
            existing.lastUpdateTime = now;
          }
        }
      }
    });

    this.updateEstimates();
  }

  private updateEstimates() {
    if (!this.estimates.size) {
      this.renderTime('');
      return;
    }

    let totalRemainingSeconds = 0;

    this.estimates.forEach(estimate => {
      const remainingBytes = estimate.totalBytes - estimate.processedBytes;
      if (estimate.bytesPerSecond > 0) {
        totalRemainingSeconds += remainingBytes / estimate.bytesPerSecond;
      }
    });

    this.renderCountdown(totalRemainingSeconds);
  }

  private renderCountdown(forcedSeconds?: number) {
    if (!this.estimates.size && forcedSeconds === undefined) {
      this.renderTime('');
      return;
    }

    let totalRemainingSeconds = forcedSeconds ?? 0;

    if (forcedSeconds === undefined) {
      this.estimates.forEach(estimate => {
        const remainingBytes = estimate.totalBytes - estimate.processedBytes;
        if (estimate.bytesPerSecond > 0) {
          totalRemainingSeconds += remainingBytes / estimate.bytesPerSecond;
        }
      });
    }

    const minutes = Math.floor(totalRemainingSeconds / 60);
    const seconds = Math.floor(totalRemainingSeconds % 60);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    this.renderTime(timeString);
  }

  private renderTime(time: string) {
    if (this.targetElement && this.lastDisplayedTime !== time) {
      this.lastDisplayedTime = time;
      this.targetElement.innerText = time;
    }
  }
} 