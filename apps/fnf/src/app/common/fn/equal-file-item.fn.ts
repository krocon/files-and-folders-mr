import {FileItemIf} from "@fnf-data";

/**
 * Compares two FileItemIf objects for equality based on their base name and directory path.
 *
 * This function determines if two file items represent the same file by comparing their
 * base name (filename with extension) and directory path. Other properties like size, date,
 * extension, metadata, or attributes are not considered for equality comparison.
 *
 * The function is commonly used in file operations like:
 * - Finding files in a collection
 * - Updating specific files in a table
 * - Checking if files already exist in a directory listing
 * - Removing files from a collection
 *
 * @param {FileItemIf} a - The first file item to compare
 * @param {FileItemIf} b - The second file item to compare
 * @returns {boolean} True if both file items reference the same file (same base name and directory),
 *                    false otherwise
 *
 * @example
 * // Check if a file exists in a collection
 * const exists = tableApi.findRows(newFiles, equalFileItem).length > 0;
 *
 * @example
 * // Update a specific file in a table
 * tableApi.updateRows([updatedFile], equalFileItem);
 *
 * @example
 * // Remove files from a collection
 * tableApi.removeRows(filesToRemove, equalFileItem);
 */
export const equalFileItem = (a: FileItemIf, b: FileItemIf) => a.base === b.base && a.dir === b.dir;