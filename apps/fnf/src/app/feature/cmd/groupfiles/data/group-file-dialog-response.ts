import {QueueActionEvent} from "../../../task/domain/queue-action-event";
import {GroupFilesData} from "./group-files.data";


export class GroupFileDialogResponse {

  constructor(
    public queueActionEvents: QueueActionEvent[],
    public groupFilesData: GroupFilesData
  ) {

  }


}