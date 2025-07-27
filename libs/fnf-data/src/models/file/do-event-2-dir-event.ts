import {DoEvent} from "./do-event";
import {DirEvent} from "../dir/dir-event";


export const doEvent2DirEvent = (doEvent: DoEvent): DirEvent[] => {
  const ret: DirEvent = new DirEvent("");
  return [ret];
};
