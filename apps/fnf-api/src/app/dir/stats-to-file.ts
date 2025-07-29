import {Stats} from "fs";
import {FileItem} from "@fnf-data";

/**
 * Populates a FileItem object with information from a file system Stats object.
 *
 * This utility function takes a Node.js fs.Stats object and transfers relevant file
 * information to a FileItem object. It populates the following properties:
 * - size: File size in bytes (null for directories)
 * - date: ISO formatted string of the file's access time
 * - isDir: Boolean flag indicating whether the item is a directory
 *
 * @param stats - Node.js fs.Stats object containing file system information
 * @param fileItem - The FileItem object to be populated with stats information
 * @returns The populated FileItem object (same instance that was passed in)
 *
 * @example
 * // Create a FileItem and populate it with stats
 * const fileItem = new FileItem('/home/user', 'document.txt', '.txt');
 * const stats = fs.statSync('/home/user/document.txt');
 *
 * // Populate the FileItem with stats information
 * stats2FileItem(stats, fileItem);
 *
 * // Now fileItem contains size, date and isDir information
 * console.log(`File size: ${fileItem.size}`);
 * console.log(`Last accessed: ${fileItem.date}`);
 * console.log(`Is directory: ${fileItem.isDir}`);
 *
 * @example
 * // Using with error handling
 * const fileItem = new FileItem('/home/user', 'document.txt', '.txt');
 * try {
 *   const stats = fs.statSync('/home/user/document.txt');
 *   stats2FileItem(stats, fileItem);
 * } catch (error) {
 *   if (!fileItem.meta) fileItem.meta = {};
 *   fileItem.meta.error = error;
 *   console.error('Error getting file stats:', error.message);
 * }
 *
 * @example
 * // Using with directory
 * const dirItem = new FileItem('/home/user', 'documents', '');
 * const stats = fs.statSync('/home/user/documents');
 * stats2FileItem(stats, dirItem);
 *
 * // For directories, size will be null and isDir will be true
 * console.log(dirItem.size); // null
 * console.log(dirItem.isDir); // true
 */


export function stats2FileItem(stats: Stats, fileItem: FileItem): FileItem {
  // see https://npmdoc.github.io/node-npmdoc-fs-extra/build/apidoc.html#apidoc.element.fs-extra.Stats
  if (stats) {
    fileItem.size = stats.isDirectory() ? null : stats.size;
    fileItem.date = new Date(stats.atime).toISOString();
    fileItem.isDir = stats.isDirectory();
  }
  return fileItem;
}