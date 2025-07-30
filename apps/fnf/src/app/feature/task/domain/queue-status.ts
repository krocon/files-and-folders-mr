export const queueStatusList = [
  'IDLE',
  'RUNNING',
  'ERROR',
  'PAUSED'
] as const;

export type QueueStatus = typeof queueStatusList[number];


