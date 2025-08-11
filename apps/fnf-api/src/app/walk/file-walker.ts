import {FileItem, FileItemIf, WalkData, WalkParaData} from "@fnf-data";
import {Server} from "socket.io";
import * as fs from "fs-extra";
import * as path from "path";
import * as micromatch from "micromatch";
import {AppLoggerService} from "../shared/logger.service";


export class FileWalker {

  private readonly walkData: WalkData = new WalkData();
  private files: FileItemIf[];
  private step = 0;
  private readonly STEPS_PER_MESSAGE: number;
  private readonly MAX_QUEUE_SIZE: number = 10000; // Limit memory usage
  private isDisposed = false;


  constructor(
    private readonly walkParaData: WalkParaData,
    private readonly cancellings: Record<string, boolean>,
    private readonly server: Server,
    private readonly logger: AppLoggerService
  ) {
    this.files = [];
    this.STEPS_PER_MESSAGE = walkParaData.stepsPerMessage;
    this.walkData = new WalkData(0, 0, 0, false);

    // Initialize asynchronously
    this.initializeAsync();
  }

  /**
   * Dispose of resources and cleanup memory
   */
  public dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;

    // Clear the files array to free memory
    this.files.length = 0;
    this.files = [];

    // Log final memory usage
    this.logMemoryUsage('disposal');

    this.logger.log(
      `FileWalker disposed. Processed ${this.walkData.fileCount} files, ${this.walkData.folderCount} folders`,
      'FileWalker'
    );
  }

  /**
   * Check if the walker has been disposed
   */
  public isDisposedState(): boolean {
    return this.isDisposed;
  }

  private async initializeAsync(): Promise<void> {
    const initialFiles: FileItemIf[] = [];

    for (const f of this.walkParaData.files) {
      try {
        await fs.access(f); // Check if file exists
        const stats = await fs.stat(f);
        initialFiles.push(new FileItem(f, '', '', '', stats?.size ?? -1, stats.isDirectory()));
      } catch (error) {
        // Log the error but continue processing other files
        this.logger.warn(
          `Skipping inaccessible file during initialization: ${f}`,
          'FileWalker'
        );
        this.logger.logWithMetadata(
          'warn',
          `File access error during initialization`,
          {
            filePath: f,
            error: error.message,
            operation: 'initialization'
          },
          'FileWalker'
        );
      }
    }

    this.files = [...initialFiles];
    this.emitWithDelay(this.walkParaData.emmitDataKey, this.walkData, () => this.processNextFile());
  }

  private matchesPattern(item: FileItemIf): boolean {
    if (!this.walkParaData.filePattern) {
      return false;
    }
    return (micromatch.isMatch(path.join(item.dir, item.base), this.walkParaData.filePattern));
  }

  private emitWithDelay(key: string, data: WalkData, callback: () => void): void {
    this.server.emit(key, data);
    setImmediate(callback);
  }

  private shouldEmitProgress(): boolean {
    return this.step % this.STEPS_PER_MESSAGE === 0;
  }

  private async processDirectory(item: FileItemIf): Promise<void> {
    if (this.matchesPattern(item)) {
      this.walkData.folderCount++;
    }

    if (this.shouldEmitProgress()) {
      this.emitWithDelay(this.walkParaData.emmitDataKey, this.walkData, () => this.processNextFile());
      return;
    }

    try {
      const entries = await fs.readdir(item.dir, {withFileTypes: true});
      await this.addNewFilesToProcess(entries, item.dir);
    } catch (error) {
      this.logger.warn(
        `Error reading directory: ${item.dir}`,
        'FileWalker'
      );
      this.logger.logWithMetadata(
        'warn',
        `Directory reading error`,
        {
          directoryPath: item.dir,
          error: error.message,
          operation: 'directory_read'
        },
        'FileWalker'
      );
    }
  }

  private processFile(item: FileItemIf): void {
    if (!this.matchesPattern(item)) return; // skip
    this.walkData.fileCount++;
    this.walkData.sizeSum += item.size;
    this.walkData.timestamp = Date.now();
  }

  private async addNewFilesToProcess(entries: fs.Dirent[], parentDir: string): Promise<void> {
    // Prevent memory issues by limiting queue size
    if (this.files.length > this.MAX_QUEUE_SIZE) {
      this.logger.warn(
        `Queue size limit reached (${this.MAX_QUEUE_SIZE}). Skipping directory: ${parentDir}`,
        'FileWalker'
      );
      this.logMemoryUsage('queue_limit_reached');
      return;
    }

    // Process entries in batches to prevent memory spikes
    const BATCH_SIZE = 100;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      if (this.isDisposed) return; // Stop if disposed

      const batch = entries.slice(i, i + BATCH_SIZE);
      await this.processBatch(batch, parentDir);

      // Log memory usage periodically during large operations
      if (i > 0 && i % (BATCH_SIZE * 10) === 0) {
        this.logMemoryUsage('batch_processing');
      }
    }
  }

  private async processBatch(entries: fs.Dirent[], parentDir: string): Promise<void> {
    const batchItems: FileItemIf[] = [];

    for (const entry of entries) {
      if (this.isDisposed) return; // Stop if disposed

      const fullPath = path.join(parentDir, entry.name);
      const isDir = entry.isDirectory();
      let size = 0;

      try {
        if (!isDir) {
          const stats = await fs.lstat(fullPath);
          size = stats.size;
        }
      } catch (error) {
        // Log the error but continue with size = 0
        this.logger.warn(
          `Error getting file stats for: ${fullPath}`,
          'FileWalker'
        );
        this.logger.logWithMetadata(
          'warn',
          `File stats error`,
          {
            filePath: fullPath,
            error: error.message,
            operation: 'file_stats'
          },
          'FileWalker'
        );
      }

      batchItems.push(new FileItem(
        fullPath,
        entry.name,
        '', // ext
        '', // date
        size ?? 0,
        isDir,
        false // abs
      ));
    }

    // Add batch to queue only if not disposed and under limit
    if (!this.isDisposed && this.files.length + batchItems.length <= this.MAX_QUEUE_SIZE) {
      this.files.push(...batchItems);
    }
  }

  private async processNextFile(): Promise<void> {
    // Check if disposed or cancelled before processing
    if (this.isDisposed) {
      return;
    }

    if (this.isProcessingComplete()) {
      this.emitFinalUpdate();
      return;
    }

    if (this.cancellings[this.walkParaData.emmitCancelKey]) {
      this.logger.log('Processing cancelled by user', 'FileWalker');
      this.dispose(); // Clean up on cancellation
      return;
    }

    this.step++;
    const currentItem = this.files.pop();

    // Log memory usage periodically
    if (this.step % 1000 === 0) {
      this.logMemoryUsage('periodic_check');
    }

    try {
      if (currentItem.isDir) {
        await this.processDirectory(currentItem);
      } else {
        this.processFile(currentItem);
      }

      // Check disposal state before continuing
      if (this.isDisposed) {
        return;
      }

      if (this.shouldEmitProgress()) {
        this.emitWithDelay(this.walkParaData.emmitDataKey, this.walkData, () => this.processNextFile());
      } else {
        setImmediate(() => this.processNextFile()); // Use setImmediate to prevent call stack overflow
      }
    } catch (error) {
      this.logger.error(
        `Error processing file: ${error.message}`,
        error.stack,
        'FileWalker'
      );
      this.logger.logWithMetadata(
        'error',
        `File processing error`,
        {
          currentItem: currentItem ? {
            path: currentItem.dir,
            name: currentItem.base,
            isDirectory: currentItem.isDir
          } : 'unknown',
          error: error.message,
          operation: 'file_processing',
          memoryUsage: this.getMemoryUsage()
        },
        'FileWalker'
      );

      // Continue processing if not disposed
      if (!this.isDisposed) {
        setImmediate(() => this.processNextFile());
      }
    }
  }

  private isProcessingComplete(): boolean {
    return this.files.length === 0;
  }

  private emitFinalUpdate(): void {
    this.walkData.last = true;
    this.emitWithDelay(this.walkParaData.emmitDataKey, this.walkData, () => {
      // Final emit completed - cleanup resources
      this.dispose();
    });
  }

  /**
   * Get current memory usage information
   */
  private getMemoryUsage(): { rss: number; heapUsed: number; queueSize: number } {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      queueSize: this.files.length
    };
  }

  /**
   * Log memory usage at key points
   */
  private logMemoryUsage(operation: string): void {
    const memory = this.getMemoryUsage();

    if (memory.queueSize > 1000 || memory.heapUsed > 100) {
      this.logger.logWithMetadata(
        'info',
        `Memory usage during ${operation}`,
        {
          rss: `${memory.rss} MB`,
          heapUsed: `${memory.heapUsed} MB`,
          queueSize: memory.queueSize,
          operation,
          step: this.step
        },
        'FileWalker'
      );
    }
  }
}