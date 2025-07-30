import {FileItemIf, FilePara, PanelIndex} from "@fnf-data";
import {ActionEventStatus} from "./action-event-status";
import {QueueActionEventType} from "./queue-action-event.type";


export class QueueActionEvent {

  constructor(
    public panelIndex: PanelIndex,
    public filePara: FilePara,
    public status: ActionEventStatus,
    public id: number = 0,
    public size: number = 0, // size of source file/folder in bytes
    public duration: number = 0, // duration in millis
  ) {
  }

  // Getters to maintain compatibility with existing code
  get action(): QueueActionEventType {
    return this.filePara.cmd as unknown as QueueActionEventType;
  }

  get src(): FileItemIf {
    return this.filePara.source as FileItemIf;
  }

  get target(): FileItemIf {
    return this.filePara.target as FileItemIf;
  }
}
