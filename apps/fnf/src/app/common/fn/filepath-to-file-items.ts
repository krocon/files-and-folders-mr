import {FileItem, FileItemIf} from "@fnf-data";

/**
 * Converts a file path string into a FileItem object with parsed directory, filename, and extension components.
 *
 * This function takes a complete file path and extracts the directory path, base filename (including extension),
 * and file extension into a structured FileItem object. The base property includes the full filename with
 * extension, while the ext property contains just the extension part.
 *
 * @param path - The complete file path to parse (e.g., "/Users/abc/Filme/mk.txt")
 * @returns A FileItemIf object containing the parsed path components
 *
 * @example
 * ```typescript
 * // Basic usage with a file path
 * const result = filepath2FileItem("/Users/abc/Filme/mk.txt");
 * console.log(result.dir);  // "/Users/abc/Filme"
 * console.log(result.base); // "mk.txt"
 * console.log(result.ext);  // ".txt"
 * ```
 *
 * @example
 * ```typescript
 * // File without extension
 * const result = filepath2FileItem("/home/user/documents/README");
 * console.log(result.dir);  // "/home/user/documents"
 * console.log(result.base); // "README"
 * console.log(result.ext);  // ""
 * ```
 *
 * @example
 * ```typescript
 * // File with multiple dots in name
 * const result = filepath2FileItem("/var/log/app.config.json");
 * console.log(result.dir);  // "/var/log"
 * console.log(result.base); // "app.config.json"
 * console.log(result.ext);  // ".json"
 * ```
 *
 * @example
 * ```typescript
 * // Windows-style path (though function uses '/' separator)
 * const result = filepath2FileItem("C:/Users/John/Documents/file.pdf");
 * console.log(result.dir);  // "C:/Users/John/Documents"
 * console.log(result.base); // "file.pdf"
 * console.log(result.ext);  // ".pdf"
 * ```
 *
 * @since 1.0.0
 */
export function filepath2FileItem(path: string): FileItemIf {

  // Split the path by '/'
  const segments = path.split('/');
  const fileName = segments.pop() || '';
  const dirPath = segments.join('/');

  // Split filename into base and extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const base = fileName;
  const ext = lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex);

  // Create FileItem with the parsed components
  return new FileItem(
    dirPath,    // dir: directory path
    base,       // base: filename without extension
    ext,        // ext: file extension
    '',         // date: empty
    0,          // size: 0
    false,      // isDir: false since this is a file
    false
  );
}
