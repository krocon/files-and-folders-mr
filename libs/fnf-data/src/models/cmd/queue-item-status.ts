export type QueueItemStatus = 
  | 'NEW'
  | 'IDLE' 
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'ERROR'
  | 'WARNING';

export function isQueueItemFinished(status: QueueItemStatus): boolean {
  return status === 'SUCCESS' || status === 'ERROR' || status === 'WARNING';
}

export function isQueueItemRunning(status: QueueItemStatus): boolean {
  return status === 'PROCESSING';
}

export function isQueueItemPending(status: QueueItemStatus): boolean {
  return status === 'NEW' || status === 'IDLE' || status === 'PENDING';
} 