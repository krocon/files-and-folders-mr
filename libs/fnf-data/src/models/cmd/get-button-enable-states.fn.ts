import {FileItemIf} from "../dir/file-item.if";
import {ButtonEnableStates} from "./button-enable-states";
import {EXP_ZIP_FILE_URL} from "../file/zip-matcher";


export function getButtonEnableStates(items: FileItemIf[]): ButtonEnableStates {
  const states = new ButtonEnableStates();
  states.OPEN_COPY_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_EDIT_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_MOVE_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_DELETE_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_MKDIR_DLG = true;
  states.OPEN_RENAME_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_UNPACK_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  return states;
}
