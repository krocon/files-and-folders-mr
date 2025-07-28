export const queueActionEventTypes = [
  'refresh_panel',
  'mkdir',
  'createfile',
  'copy',
  'move',
  'remove',
  'delempty',
  'rename',
  'refresh_job_queue_table',
  'open_job_queue_table',
  'update',
  'created',
  'open',
  'unpack',
  'reload'
] as const;

export type QueueActionEventType = typeof queueActionEventTypes[number];