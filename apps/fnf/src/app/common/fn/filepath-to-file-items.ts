import {FileItem, FileItemIf} from "@fnf-data";


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
