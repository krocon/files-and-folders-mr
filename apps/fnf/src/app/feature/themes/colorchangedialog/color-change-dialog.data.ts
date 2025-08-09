import {ThemeTableRow} from "../theme-table-row.model";

export interface ColorChangeDialogData {
  themeTableData: ThemeTableRow[];
  rows: ThemeTableRow[];
  onChange?: (rows: ThemeTableRow[]) => void;
}