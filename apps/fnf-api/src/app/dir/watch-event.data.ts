import {DirWatcherEventType} from "@fnf-data";


export class WatchEventData {


  constructor(
    public event: DirWatcherEventType,
    public file: string
  ) {
  }
}
