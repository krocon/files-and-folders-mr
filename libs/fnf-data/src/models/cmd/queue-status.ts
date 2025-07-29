export type QueueStatus = 
  | 'STOPPED'
  | 'RUNNING'
  | 'PAUSED'
  | 'ERROR';

export function isQueueRunning(status: QueueStatus): boolean {
  return status === 'RUNNING';
}

export function isQueuePaused(status: QueueStatus): boolean {
  return status === 'PAUSED';
}

export function isQueueStopped(status: QueueStatus): boolean {
  return status === 'STOPPED' || status === 'ERROR';
}

export function canQueueResume(status: QueueStatus): boolean {
  return status === 'STOPPED' || status === 'PAUSED' || status === 'ERROR';
} 