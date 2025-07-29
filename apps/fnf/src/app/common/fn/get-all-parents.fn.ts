/**
 * Returns an array of all parent paths for a given file system path.
 *
 * This function navigates from the provided path up to the root directory,
 * collecting each parent directory along the way. It handles special cases
 * like root paths, trailing slashes, and empty inputs.
 *
 * @param {string} path - The file system path to get parents for
 * @returns {string[]} An array of parent paths, ordered from root to the deepest parent
 *
 * @example
 * // Returns ['/Users', '/Users/marckronberg', '/Users/marckronberg/Filme.nosync', '/Users/marckronberg/Filme.nosync/_Filme']
 * getAllParents('/Users/marckronberg/Filme.nosync/_Filme');
 *
 * @example
 * // Returns ['/Users', '/Users/marckronberg']
 * getAllParents('/Users/marckronberg/');
 *
 * @example
 * // Returns ['/Users']
 * getAllParents('/Users');
 *
 * @example
 * // Returns ['/']
 * getAllParents('/');
 *
 * @example
 * // Returns ['/']
 * getAllParents('');
 */
export function getAllParents(path:string):string[] {
  // If path is empty or just a slash, return an array with just the root
  if (!path || path === '/') {
    return ['/'];
  }

  // Remove trailing slash if present (except for root path)
  const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

  const result: string[] = [];
  let currentPath = normalizedPath;

  // Add the path itself and all its parents to the result array
  while (currentPath !== '') {
    // Only add paths that are not the root path
    if (currentPath !== '/') {
      result.unshift(currentPath);
    }

    // If we've reached the root, break the loop
    if (currentPath === '/') {
      break;
    }

    // Get the parent directory
    const lastSlashIndex = currentPath.lastIndexOf('/');

    // If no slash found or it's the first character (root path), set to root
    if (lastSlashIndex <= 0) {
      currentPath = '/';
    } else {
      currentPath = currentPath.substring(0, lastSlashIndex);
    }
  }

  return result;
}
