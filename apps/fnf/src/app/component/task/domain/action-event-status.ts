export const actionEventStatusList = [
  'PENDING', // waiting
  'PROCESSING', // Running
  'ERROR', // done:
  'SUCCESS' // done:
] as const;
export type ActionEventStatus = typeof actionEventStatusList[number];