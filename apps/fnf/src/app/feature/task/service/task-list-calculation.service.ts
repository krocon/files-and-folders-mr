import {Injectable, NgZone} from '@angular/core';
import {isQueuePaused, isQueueRunning, QueueStatus} from "@fnf-data";
import {QueueActionEvent} from "../domain/queue-action-event";
import {ActionQueueService} from "./action-queue.service";


interface HistoricalPerformance {
  operation: 'copy' | 'move';
  bytesPerSecond: number;
  timestamp: number;
}

interface ActiveOperation {
  id: number;
  operation: 'copy' | 'move';
  totalBytes: number;
  startTime: number;
}

@Injectable({providedIn: 'root'})
export class TaskListCalculationService {

  private historicalPerformance: HistoricalPerformance[] = [];
  private activeOperations: Map<number, ActiveOperation> = new Map();
  private updateInterval: any;
  private renderInterval: any;
  private targetElement: HTMLElement | null = null;
  private lastDisplayedTime: string = '';
  private readonly maxHistoryEntries = 50; // Keep last 50 completed operations


  constructor(
    private readonly ngZone: NgZone,
    private readonly actionQueueService: ActionQueueService
  ) {
  }

  startTracking(element: HTMLElement) {
    this.targetElement = element;
    this.stopTracking(); // Clear any existing intervals

    // Run calculations outside Angular
    this.ngZone.runOutsideAngular(() => {
      // Monitor queue and update estimates every 5 seconds
      this.updateInterval = setInterval(() => this.monitorQueueAndUpdateEstimates(), 5000);

      // Render countdown every second
      this.renderInterval = setInterval(() => this.calculateRemainingTime(), 1000);
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

  /**
   * Backward compatibility method - now triggers queue monitoring
   * @deprecated Use the automatic queue monitoring instead
   */
  updateQueue(actions: QueueActionEvent[], queueStatus: QueueStatus) {
    // For backward compatibility, trigger an immediate update
    this.monitorQueueAndUpdateEstimates();
  }

  /**
   * Monitors the main queue and updates estimates based on historical performance data
   */
  private monitorQueueAndUpdateEstimates() {
    try {
      const mainQueue = this.actionQueueService.getQueue(0);

      if (!isQueueRunning(mainQueue.status as QueueStatus)) {
        if (isQueuePaused(mainQueue.status as QueueStatus)) {
          // Keep showing last time during pause
          this.renderTime(this.lastDisplayedTime);
        } else {
          // Clear time for other states
          this.renderTime('');
          this.activeOperations.clear();
        }
        return;
      }

      this.processQueueActions(mainQueue.actions);
      this.calculateRemainingTime();
    } catch (error) {
      console.error('Error monitoring queue:', error);
    }
  }

  /**
   * Process queue actions to track completed operations and active operations
   */
  private processQueueActions(actions: QueueActionEvent[]) {
    actions.forEach(actionEvent => {
      if (actionEvent.filePara.cmd !== 'copy' && actionEvent.filePara.cmd !== 'move') return;

      const operation = actionEvent.filePara.cmd as 'copy' | 'move';
      const actionId = actionEvent.id;

      if (actionEvent.status === 'SUCCESS' && actionEvent.duration > 0) {
        // Process completed operation for historical data
        this.addHistoricalPerformance(operation, actionEvent.size, actionEvent.duration);
        this.activeOperations.delete(actionId);

      } else if (actionEvent.status === 'ERROR') {
        // Remove failed operation from active tracking
        this.activeOperations.delete(actionId);

      } else if (actionEvent.status === 'PROCESSING') {
        // Track active operation
        if (!this.activeOperations.has(actionId)) {
          this.activeOperations.set(actionId, {
            id: actionId,
            operation,
            totalBytes: actionEvent.size,
            startTime: actionEvent.startTime
          });
        }
      }
    });
  }

  /**
   * Add historical performance data from completed operation
   */
  private addHistoricalPerformance(operation: 'copy' | 'move', bytes: number, durationMs: number) {
    if (bytes <= 0 || durationMs <= 0) return;

    const bytesPerSecond = (bytes * 1000) / durationMs; // Convert ms to seconds

    this.historicalPerformance.push({
      operation,
      bytesPerSecond,
      timestamp: Date.now()
    });

    // Keep only recent entries
    if (this.historicalPerformance.length > this.maxHistoryEntries) {
      this.historicalPerformance = this.historicalPerformance.slice(-this.maxHistoryEntries);
    }
  }

  /**
   * Calculate remaining time based on historical performance data and pending operations
   */
  private calculateRemainingTime() {
    try {
      const mainQueue = this.actionQueueService.getQueue(0);
      let totalRemainingSeconds = 0;

      // Get pending and processing operations
      const pendingOperations = mainQueue.actions.filter(action =>
        (action.filePara.cmd === 'copy' || action.filePara.cmd === 'move') &&
        (action.status === 'PENDING' || action.status === 'PROCESSING')
      );

      if (pendingOperations.length === 0) {
        this.renderTime('');
        return;
      }

      // Calculate remaining time for each operation
      pendingOperations.forEach(operation => {
        const operationType = operation.filePara.cmd as 'copy' | 'move';
        const operationBytes = operation.size;

        if (operationBytes > 0) {
          const estimatedSeconds = this.estimateOperationTime(operationType, operationBytes);

          // For processing operations, subtract elapsed time
          if (operation.status === 'PROCESSING') {
            const elapsedSeconds = (Date.now() - operation.startTime) / 1000;
            totalRemainingSeconds += Math.max(0, estimatedSeconds - elapsedSeconds);
          } else {
            totalRemainingSeconds += estimatedSeconds;
          }
        }
      });

      this.renderCountdown(totalRemainingSeconds);
    } catch (error) {
      console.error('Error calculating remaining time:', error);
      this.renderTime('');
    }
  }

  /**
   * Estimate operation time based on historical performance data
   */
  private estimateOperationTime(operation: 'copy' | 'move', bytes: number): number {
    // Get recent historical data for this operation type
    const recentHistory = this.historicalPerformance
      .filter(h => h.operation === operation)
      .slice(-10); // Use last 10 operations of this type

    if (recentHistory.length === 0) {
      // Fallback: assume 10MB/s for copy, 50MB/s for move (move is typically faster)
      const fallbackBytesPerSecond = operation === 'copy' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      return bytes / fallbackBytesPerSecond;
    }

    // Calculate weighted average (more recent operations have higher weight)
    let totalWeightedSpeed = 0;
    let totalWeight = 0;
    const now = Date.now();

    recentHistory.forEach((entry, index) => {
      // Weight based on recency and position (more recent = higher weight)
      const ageWeight = Math.exp(-(now - entry.timestamp) / (24 * 60 * 60 * 1000)); // Decay over 24 hours
      const positionWeight = (index + 1) / recentHistory.length; // Later entries have higher weight
      const weight = ageWeight * positionWeight;

      totalWeightedSpeed += entry.bytesPerSecond * weight;
      totalWeight += weight;
    });

    const averageBytesPerSecond = totalWeight > 0 ? totalWeightedSpeed / totalWeight : recentHistory[recentHistory.length - 1].bytesPerSecond;
    return bytes / averageBytesPerSecond;
  }

  private renderCountdown(totalRemainingSeconds: number) {
    if (totalRemainingSeconds <= 0) {
      this.renderTime('');
      return;
    }

    const minutes = Math.floor(totalRemainingSeconds / 60);
    const seconds = Math.floor(totalRemainingSeconds % 60);

    if (minutes > 360) {
      this.renderTime('?');
      return;
    }

    let timeString: string;
    if (minutes >= 60) {
      const hours = Math.floor(totalRemainingSeconds / 3600);
      const remainingMinutes = Math.floor((totalRemainingSeconds % 3600) / 60);
      timeString = `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    this.renderTime(timeString);
  }

  private renderTime(time: string) {
    if (this.targetElement && this.lastDisplayedTime !== time) {
      this.lastDisplayedTime = time;
      this.targetElement.innerText = time;
    }
  }
}