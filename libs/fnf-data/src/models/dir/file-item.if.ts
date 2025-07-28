import {FileItemMetaIf} from "./file-item-meta.if";
import {FileAttributeType} from "./file-attribute.type";

/**
 *
 * Example:
 * {
 *       "dir": "/Users/abc/Filme",
 *       "base": "mk.txt" (base includes extension),
 *       "ext": ".txt" (extension with '.')
 *   }
 */
export interface FileItemIf {
  dir: string;
  base: string;
  ext: string;
  size: number;
  date: string;
  isDir: boolean;
  abs: boolean;

  meta?: FileItemMetaIf;
  attributes?: FileAttributeType;
}
