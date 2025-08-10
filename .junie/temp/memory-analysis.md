# Memory Management Issues Analysis - FileWalker

## Current Issues Identified

### 1. FileWalker Instance Lifecycle Issues (walk.gateway.ts:33)
- **Problem**: `new FileWalker()` creates instances without storing references
- **Impact**: Orphaned instances cannot be tracked, cancelled, or cleaned up
- **Memory leak**: Each "walkdir" message creates new instances without disposing old ones

### 2. Unbounded Array Growth (file-walker.ts:146)
- **Problem**: `this.files.push()` in `addNewFilesToProcess()` continuously adds items
- **Impact**: For large directory trees, the array grows exponentially
- **Memory usage**: Each directory traversal adds all entries to memory before processing

### 3. Incomplete Cancellation Mechanism
- **Problem**: `cancellings` object in gateway grows indefinitely
- **Impact**: Memory leak as cancelled IDs are never cleaned up
- **Incomplete cleanup**: Cancellation stops processing but doesn't free memory

### 4. Recursive Processing Pattern
- **Current**: Uses `setImmediate()` to prevent stack overflow (good)
- **Issue**: Still recursive in nature, could be more efficient with iterative approach

## Memory Usage Patterns

### Large Directory Processing
```
Initial files array: [file1, file2, ...]
After processing dir1: [file1, file2, ..., subfile1, subfile2, ..., subdir1, subdir2]
After processing subdir1: [file1, file2, ..., subfile2, ..., subdir2, subsubfile1, subsubfile2, ...]
```

### Exponential Growth Example
- Directory with 1000 subdirs, each with 100 files
- Peak memory: 100,000+ FileItem objects in array
- Memory never released until completion

## Proposed Solutions

1. **Instance Tracking**: Store FileWalker references in Map with cleanup
2. **Streaming Processing**: Process files as discovered, not batch in array
3. **Memory Monitoring**: Track and log memory usage
4. **Proper Cleanup**: Implement dispose methods and automatic cleanup
5. **Batch Processing**: Limit array size with configurable batches