import {SysinfoIf} from "./sysinfo.if";


export interface AllinfoIf {
  sysinfo?: SysinfoIf;
  env: { [key: string]: string[] };

}
