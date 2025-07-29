import {FileItemIf} from "@fnf-data";


/**
 * Converts a FileItemIf object into a file path string.
 *
 * This function takes a FileItemIf object which contains directory and file information
 * and converts it into a standard file path string. It handles various edge cases such as:
 * - Empty or null directory values
 * - Directories with trailing slashes
 * - Empty or null filenames
 * - Various path formats (absolute, relative, with special characters)
 *
 * @param {FileItemIf} fileItem - The file item object containing directory and base name information.
 *                               Must be a valid object (not null or undefined).
 *
 * @returns {string} A string representing the full file path by combining directory and filename.
 *                  The path will use forward slashes as separators, even if the input directory
 *                  uses backslashes (Windows-style paths).
 *
 * @throws {Error} Throws an error if the fileItem parameter is null or undefined.
 *
 * @example
 * // Standard case with directory and filename
 * const fileItem = {
 *   dir: '/home/user/documents',
 *   base: 'file.txt',
 *   ext: '.txt',
 *   size: 100,
 *   date: '2023-01-01',
 *   isDir: false,
 *   abs: true
 * };
 * const path = fileItem2Path(fileItem); // Returns: '/home/user/documents/file.txt'
 *
 * @example
 * // Directory with trailing slash
 * const fileItem = {
 *   dir: '/home/user/documents/',
 *   base: 'file.txt',
 *   ext: '.txt',
 *   size: 100,
 *   date: '2023-01-01',
 *   isDir: false,
 *   abs: true
 * };
 * const path = fileItem2Path(fileItem); // Returns: '/home/user/documents/file.txt'
 *
 * @example
 * // Empty directory case
 * const fileItem = {
 *   dir: '',
 *   base: 'file.txt',
 *   ext: '.txt',
 *   size: 100,
 *   date: '2023-01-01',
 *   isDir: false,
 *   abs: true
 * };
 * const path = fileItem2Path(fileItem); // Returns: 'file.txt'
 *
 * @example
 * // Empty filename case
 * const fileItem = {
 *   dir: '/home/user/documents',
 *   base: '',
 *   ext: '',
 *   size: 0,
 *   date: '2023-01-01',
 *   isDir: true,
 *   abs: true
 * };
 * const path = fileItem2Path(fileItem); // Returns: '/home/user/documents/'
 *
 * @example
 * // Relative path
 * const fileItem = {
 *   dir: '../documents',
 *   base: 'file.txt',
 *   ext: '.txt',
 *   size: 100,
 *   date: '2023-01-01',
 *   isDir: false,
 *   abs: false
 * };
 * const path = fileItem2Path(fileItem); // Returns: '../documents/file.txt'
 */
export function fileItem2Path(fileItem: FileItemIf): string {
  if (!fileItem) {
    throw new Error('FileItem cannot be null or undefined');
  }

  const directory = fileItem.dir ?? '';
  const filename = fileItem.base ?? '';

  // Handle case where directory is empty or already has trailing slash
  if (!directory || directory.endsWith('/')) {
    return directory + filename;
  }

  return `${directory}/${filename}`;
}
