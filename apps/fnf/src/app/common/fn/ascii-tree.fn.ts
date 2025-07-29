/**
 * Converts a list of file/directory paths into an ASCII tree representation with path references.
 *
 * This function takes an array of path strings and creates a visual tree structure
 * that represents the hierarchy of directories and files, similar to what you might
 * see with command-line tools like `tree`. Each node in the returned array includes
 * both the visual representation (label) and the corresponding path.
 *
 * The function:
 * 1. Builds a tree data structure from the input paths
 * 2. Identifies and marks leaf nodes
 * 3. Renders the tree as ASCII art with proper branch characters
 * 4. Returns an array of objects containing path and formatted label pairs
 *
 * @param {string[]} rows - Array of path strings (e.g., ['/folder/subfolder', '/folder/file.txt'])
 *
 * @returns {{ path: string, label: string }[]} Array of objects where:
 *   - `path` is the full path to the node
 *   - `label` is the formatted ASCII tree representation with proper indentation and branch characters
 *
 * @example
 * // Input paths
 * const paths = [
 *   '/home/user/documents',
 *   '/home/user/pictures',
 *   '/home/user/pictures/vacation',
 *   '/home/user/music'
 * ];
 *
 * // Call the function
 * const asciiTree = createAsciiTree(paths);
 *
 * // Result will be:
 * // [
 * //   { path: '/home', label: 'home' },
 * //   { path: '/home/user', label: '└── user' },
 * //   { path: '/home/user/documents', label: '    ├── documents' },
 * //   { path: '/home/user/music', label: '    ├── music' },
 * //   { path: '/home/user/pictures', label: '    └── pictures' },
 * //   { path: '/home/user/pictures/vacation', label: '        └── vacation' }
 * // ]
 *
 * // To print the ASCII tree:
 * asciiTree.forEach(item => console.log(item.label));
 * // Output:
 * // home
 * // └── user
 * //     ├── documents
 * //     ├── music
 * //     └── pictures
 * //         └── vacation
 *
 * @see {@link TreeNode} - The internal tree node structure used to build the hierarchy
 * @see {@link markLeafNodes} - Helper function that identifies leaf nodes in the tree
 * @see {@link renderTree} - Helper function that converts the tree to ASCII representation
 */
export function createAsciiTree(rows: string[]): {path: string, label: string}[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Create a tree structure from the directory paths
  const tree: TreeNode = { name: '', children: {}, isLeaf: false, path: '' };

  // Sort the rows to ensure consistent output
  const sortedRows = [...rows].sort((a, b) => a.localeCompare(b));

  // Build the tree structure
  for (const row of sortedRows) {
    const parts = row.split('/').filter(part => part.length > 0);

    let currentNode = tree;
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += '/' + part;
      if (!currentNode.children[part]) {
        currentNode.children[part] = {
          name: part,
          children: {},
          isLeaf: false, // Initialize as non-leaf
          path: currentPath
        };
      }
      currentNode = currentNode.children[part];
    }
  }

  // Mark leaf nodes (directories that don't have children)
  markLeafNodes(tree);

  // Convert the tree to ASCII representation with paths
  const result: {path: string, label: string}[] = [];
  renderTree(tree, '', '', result);

  // Remove the root node (empty string) if it exists
  if (result.length > 0 && result[0].label.trim() === '') {
    result.shift();
  }

  return result;
}

/**
 * Marks nodes as leaf nodes if they don't have any children
 */
function markLeafNodes(node: TreeNode): boolean {
  const childrenKeys = Object.keys(node.children);

  if (childrenKeys.length === 0) {
    node.isLeaf = true;
    return true;
  }

  let allChildrenAreLeaves = true;
  for (const key of childrenKeys) {
    const childIsLeaf = markLeafNodes(node.children[key]);
    allChildrenAreLeaves = allChildrenAreLeaves && childIsLeaf;
  }

  // A node is not a leaf if it has at least one child that is not a leaf
  node.isLeaf = false;
  return false;
}

/**
 * Recursively renders a tree node and its children as ASCII art
 */
function renderTree(node: TreeNode, prefix: string, childPrefix: string, result: {path: string, label: string}[]): void {
  // Skip the root node
  if (node.name !== '') {
    // Display the node with its prefix and store its path
    result.push({
      path: node.path,
      label: `${prefix}${node.name}`
    });
  }

  const childrenKeys = Object.keys(node.children);

  // Sort the children keys to ensure consistent output
  const sortedKeys = childrenKeys.sort();

  sortedKeys.forEach((key, index) => {
    const isLast = index === sortedKeys.length - 1;
    const child = node.children[key];

    // Determine the prefixes for the current node and its children
    const currentPrefix = isLast ? '└── ' : '├── ';
    const nextChildPrefix = isLast ? '    ' : '│   ';

    renderTree(
      child,
      childPrefix + currentPrefix,
      childPrefix + nextChildPrefix,
      result
    );
  });
}

/**
 * Interface for tree node structure
 */
interface TreeNode {
  name: string;
  children: { [key: string]: TreeNode };
  isLeaf: boolean;
  path: string;
}


/**
 * Filters an ASCII tree based on a predicate function
 * If a row matches the predicate, all its parent rows will also be included in the result
 * @param rows Array of objects with path and label properties
 * @param predicate Function that determines if a row should be included
 * @returns Filtered array of objects with path and label properties
 */
export function filterAsciiTree(
  rows: {path: string, label: string}[],
  predicate: (row: {path: string, label: string}) => boolean,
  ):{path: string, label: string}[] {

  if (!rows || rows.length === 0) {
    return [];
  }

  // First, find all rows that match the predicate
  const matchingRows = rows.filter(row => predicate(row));

  // If no rows match, return empty array
  if (matchingRows.length === 0) {
    return [];
  }

  // Create a set of paths that should be included in the result
  const pathsToInclude = new Set<string>();

  // For each matching row, add its path and all parent paths to the set
  matchingRows.forEach(row => {

    // Add the current path, if the leaf is ok for predicate filter
    const lastSegment = row.path.split('/').filter(p => p).pop() || '';
    let r = {path:lastSegment, label:''};
    if (predicate(r)) {
      pathsToInclude.add(row.path);
    }
  });

  // Filter the original rows to include only those with paths in the set
  return rows.filter(row => pathsToInclude.has(row.path));
}
