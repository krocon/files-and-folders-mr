export type ToolData = ToolIf[];

export interface ToolIf {
  id: string;
  label: string;
  shortcut: string;
  cmd: string;
  fileLimit: number,
  para: string;
  local: boolean
}