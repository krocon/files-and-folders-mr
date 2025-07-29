import {DOT_DOT, FileItemIf} from "@fnf-data";

/**
 * Compares two FileItemIf objects for sorting purposes in file listings.
 *
 * This comparator function implements a specialized file sorting algorithm that:
 * 1. Always places parent directory entries (typically ".." represented by DOT_DOT) at the top
 * 2. Groups directories together and displays them before files
 * 3. Performs case-insensitive alphabetical sorting by full path (dir + base) within same type groups
 *
 * The function supports both ascending and descending sort orders through the multiplier parameter (f).
 *
 * @param value1 - First FileItemIf object to compare
 * @param value2 - Second FileItemIf object to compare
 * @param row1 - Optional row data associated with the first file item (not used in comparison)
 * @param row2 - Optional row data associated with the second file item (not used in comparison)
 * @param f - Sort direction multiplier: 1 for ascending (default), -1 for descending
 * @returns A number indicating sort order:
 *   - Negative: value1 should be placed before value2
 *   - Positive: value1 should be placed after value2
 *   - Zero: values are equivalent for sorting purposes
 *
 * @example
 * // Sort an array of FileItemIf objects in ascending order
 * const files: FileItemIf[] = [
 *   { dir: '/home', base: 'document.txt', ext: '.txt', isDir: false, size: 1024, date: '2023-01-01', abs: false },
 *   { dir: '/home', base: 'images', ext: '', isDir: true, size: 0, date: '2023-01-01', abs: false },
 *   { dir: '/home', base: '..', ext: '', isDir: true, size: 0, date: '2023-01-01', abs: false }
 * ];
 * files.sort((a, b) => fileItemComparator(a, b));
 * // Result: parent directory (..) first, then 'images' directory, then 'document.txt' file
 *
 * @example
 * // Sort in descending order
 * files.sort((a, b) => fileItemComparator(a, b, undefined, undefined, -1));
 * // Reverses order within same type groups, but still keeps parent directory first and directories before files
 */
export function fileItemComparator(value1: FileItemIf, value2: FileItemIf, row1?: any, row2?: any, f?: number): number {
  if (f === undefined || f === null) f = 1;
  if (!value1) return 1;
  if (!value2) return -1;
  if (value1.base === DOT_DOT) return -1000 * f;
  if (value2.base === DOT_DOT) return 1000 * f;
  // Regardless of the sort order (ascending or descending), we always want directories to be displayed at the top:
  if (value1.isDir && !value2.isDir) return -10 * f;
  if (!value1.isDir && value2.isDir) return 10 * f;
  return (value1.dir+value1.base).toUpperCase().localeCompare((value2.dir+value2.base).toUpperCase());
}