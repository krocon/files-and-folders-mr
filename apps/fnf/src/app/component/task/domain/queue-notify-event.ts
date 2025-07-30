import {QueueNotifyEventIf} from "./queue-notify-event.if";
import {QueueActionEventType} from "./queue-action-event.type";
import {OnDoResponseType} from "@fnf-data";

export class QueueNotifyEvent implements QueueNotifyEventIf{

  constructor(
    public type: QueueActionEventType,
    public data: OnDoResponseType
  ) {
  }
}