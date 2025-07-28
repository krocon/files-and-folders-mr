import {FileItemIf} from "../dir/file-item.if";
import {ButtonEnableStates} from "./button-enable-states";
import {EXP_ZIP_FILE_URL} from "../file/zip-matcher";

const PACKED_FILE_EXTENSIONS = /\.(zip|rar|7z|tar|gz|bz2|xz)$/i;


export function getButtonEnableStates(items: FileItemIf[], path: string = ''): ButtonEnableStates {
  const states = new ButtonEnableStates();
  states.OPEN_COPY_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_EDIT_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL) && !items[0].isDir;
  states.OPEN_VIEW_DLG = states.OPEN_EDIT_DLG;
  states.OPEN_MOVE_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_DELETE_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_MKDIR_DLG = !path.startsWith('tabfind');
  states.OPEN_RENAME_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_UNPACK_DLG = items?.length === 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL) && !!items[0].base?.match(PACKED_FILE_EXTENSIONS);
  states.OPEN_PACK_DLG = !!items?.length && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_MULTIRENAME_DLG = items?.length > 1 && !items[0].dir?.match(EXP_ZIP_FILE_URL);
  states.OPEN_CREATE_FILE_DLG = true;
  return states;
}
