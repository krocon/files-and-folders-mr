#!/usr/bin/env ts-node

/**
 * Reproduction script for FileWalker memory management issues
 * This script demonstrates the memory problems without requiring the full NestJS setup
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Mock classes to simulate the memory issues
class MockFileItem {
  constructor(
    public dir: string,
    public base: string,
    public ext: string,
    public date: string,
    public size: number,
    public isDir: boolean,
    public abs: boolean = false
  ) {}
}

class MockWalkData {
  constructor(
    public fileCount: number = 0,
    public folderCount: number = 0,
    public sizeSum: number = 0,
    public last: boolean = false,
    public timestamp: number = Date.now()
  ) {}
}

class MockLogger {
  warn(message: string) { console.warn(`[WARN] ${message}`); }
  error(message: string, stack?: string) { console.error(`[ERROR] ${message}`); }
  logWithMetadata(level: string, message: string, metadata: any) {
    console.log(`[${level.toUpperCase()}] ${message}`, metadata);
  }
}

// Simplified FileWalker to demonstrate memory issues
class MemoryLeakyFileWalker {
  private files: MockFileItem[] = [];
  private walkData = new MockWalkData();
  private step = 0;

  constructor(
    private rootPath: string,
    private logger = new MockLogger()
  ) {
    this.initializeAsync();
  }

  private async initializeAsync() {
    console.log(`Starting memory demonstration for: ${this.rootPath}`);
    console.log(`Initial memory usage: ${this.getMemoryUsage()}`);
    
    try {
      const stats = await fs.stat(this.rootPath);
      this.files.push(new MockFileItem(this.rootPath, '', '', '', stats.size || 0, stats.isDirectory()));
      this.processNextFile();
    } catch (error) {
      this.logger.error(`Failed to initialize: ${error.message}`);
    }
  }

  private getMemoryUsage(): string {
    const used = process.memoryUsage();
    return `RSS: ${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB, ` +
           `Heap: ${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB, ` +
           `Files in queue: ${this.files.length}`;
  }

  private async processNextFile(): Promise<void> {
    if (this.files.length === 0) {
      console.log(`Processing complete. Final memory usage: ${this.getMemoryUsage()}`);
      return;
    }

    this.step++;
    const currentItem = this.files.pop()!;

    if (this.step % 100 === 0) {
      console.log(`Step ${this.step}: ${this.getMemoryUsage()}`);
    }

    try {
      if (currentItem.isDir) {
        await this.processDirectory(currentItem);
      } else {
        this.processFile(currentItem);
      }

      // Simulate the recursive processing with setImmediate
      setImmediate(() => this.processNextFile());
    } catch (error) {
      this.logger.error(`Error processing: ${error.message}`);
      setImmediate(() => this.processNextFile());
    }
  }

  private async processDirectory(item: MockFileItem): Promise<void> {
    this.walkData.folderCount++;

    try {
      const entries = await fs.readdir(item.dir, { withFileTypes: true });
      
      // This is the memory problem: adding ALL entries to the array at once
      await this.addNewFilesToProcess(entries, item.dir);
      
      if (entries.length > 10) {
        console.log(`Directory ${item.dir} added ${entries.length} entries. Total queued: ${this.files.length}`);
      }
    } catch (error) {
      this.logger.warn(`Error reading directory: ${item.dir}`);
    }
  }

  private processFile(item: MockFileItem): void {
    this.walkData.fileCount++;
    this.walkData.sizeSum += item.size;
  }

  // This method demonstrates the memory leak: unbounded array growth
  private async addNewFilesToProcess(entries: fs.Dirent[], parentDir: string): Promise<void> {
    for (const entry of entries) {
      const fullPath = path.join(parentDir, entry.name);
      const isDir = entry.isDirectory();
      let size = 0;

      try {
        if (!isDir) {
          const stats = await fs.lstat(fullPath);
          size = stats.size;
        }
      } catch (error) {
        // Continue with size = 0
      }

      // Memory issue: continuously pushing to array without bounds
      this.files.push(new MockFileItem(
        fullPath,
        entry.name,
        '',
        '',
        size || 0,
        isDir
      ));
    }
  }
}

// Create test directory structure
async function createTestStructure(testDir: string, depth: number = 3, filesPerDir: number = 5): Promise<void> {
  await fs.ensureDir(testDir);
  
  if (depth <= 0) return;
  
  // Create files
  for (let i = 0; i < filesPerDir; i++) {
    const filePath = path.join(testDir, `test-file-${i}.txt`);
    await fs.writeFile(filePath, `Test content ${i} `.repeat(100)); // Small files
  }
  
  // Create subdirectories
  for (let i = 0; i < Math.min(filesPerDir, 3); i++) {
    const subDir = path.join(testDir, `subdir-${i}`);
    await createTestStructure(subDir, depth - 1, filesPerDir);
  }
}

async function demonstrateMemoryIssue() {
  const testDir = path.join(os.tmpdir(), 'filewalker-memory-test');
  
  try {
    console.log('Creating test directory structure...');
    await createTestStructure(testDir, 4, 8); // 4 levels deep, 8 files per dir
    
    console.log('\n=== Demonstrating Memory Issue ===');
    console.log('This will show unbounded memory growth...\n');
    
    // This will demonstrate the memory leak
    new MemoryLeakyFileWalker(testDir);
    
    // Let it run for a bit
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Error during demonstration:', error);
  } finally {
    // Cleanup
    setTimeout(async () => {
      try {
        await fs.remove(testDir);
        console.log('\nTest directory cleaned up');
        process.exit(0);
      } catch (error) {
        console.error('Cleanup error:', error);
        process.exit(1);
      }
    }, 1000);
  }
}

if (require.main === module) {
  demonstrateMemoryIssue().catch(console.error);
}