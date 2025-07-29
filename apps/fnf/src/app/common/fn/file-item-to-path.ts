import {FileItemIf} from "@fnf-data";


/**
 * Converts a FileItemIf object to a file path string.
 *
 * @param fileItem - The file item to convert to a path
 * @returns The full file path as a string
 * @throws Error if fileItem is null or undefined
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
