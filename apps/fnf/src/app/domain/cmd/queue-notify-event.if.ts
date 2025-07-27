import {QueueActionEventType} from "./queue-action-event.type";
import {OnDoResponseType} from "@fnf-data";

export interface QueueNotifyEventIf {

  type: QueueActionEventType;
  data: OnDoResponseType;

}