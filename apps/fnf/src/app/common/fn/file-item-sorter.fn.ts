import {DOT_DOT, FileItemIf} from "@fnf-data";

/**
 * Sorts file items with a consistent, user-friendly ordering.
 *
 * This function implements a specialized sorting algorithm for file system items with the following priorities:
 * 1. Parent directory references (shown as "..") always appear first
 * 2. Directories always appear before files, regardless of sort direction
 * 3. Items of the same type (directories or files) are sorted alphabetically by base name (case-insensitive)
 *
 * @param {FileItemIf} row1 - The first file item to compare
 * @param {FileItemIf} row2 - The second file item to compare
 * @param {number} [f=1] - Sort direction multiplier:
 *                          1 for ascending order (default)
 *                         -1 for descending order
 *
 * @returns {number} Comparison result:
 *   - Negative value if row1 should appear before row2
 *   - Positive value if row1 should appear after row2
 *   - Zero if they are equivalent for sorting purposes (though this case doesn't occur in the implementation)
 *
 * @example
 * // Sort files in ascending order (directories first, then files alphabetically)
 * const sortedFiles = fileItems.sort((a, b) => fileItemSorter(a, b));
 *
 * @example
 * // Sort files in descending order (directories first, then files reverse-alphabetically)
 * const sortedFilesDesc = fileItems.sort((a, b) => fileItemSorter(a, b, -1));
 *
 * @example
 * // Usage with a grid or table component
 * const sortConfig = {
 *   compareFn: (a, b) => fileItemSorter(a, b, this.isAscending ? 1 : -1)
 * };
 */
export function fileItemSorter(row1: FileItemIf, row2: FileItemIf, f: number = 1) {

  if (!row1) return 1;
  if (!row2) return -1;

  if (row1.base === DOT_DOT) return -1000 * f;
  if (row2.base === DOT_DOT) return 1000 * f;

  // Regardless of the sort order (ascending or descending), we always want directories to be displayed at the top:
  if (row1.isDir && !row2.isDir) return -10 * f;
  if (!row1.isDir && row2.isDir) return 10 * f;

  return row1.base.toUpperCase().localeCompare(row2.base.toUpperCase());
}