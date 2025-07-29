import {Injectable} from "@angular/core";
import {WalkParaData} from "@fnf-data";
import {WalkCallback, WalkSocketService} from "./walk.socketio.service";
import {WalkdirSyncService} from "./walkdir-sync.service";


/**
 * @class WalkdirService
 * @description A facade service that provides directory traversal functionality with support for both synchronous and asynchronous modes.
 *
 * This service acts as a central entry point for directory walking operations, delegating to either the
 * synchronous HTTP-based implementation or the asynchronous WebSocket-based implementation based on the configured mode.
 * It enables recursive directory traversal to collect information about files and folders that match specified patterns.
 *
 * @injectable Provided at the root level of the application.
 */
@Injectable({
  providedIn: "root"
})
export class WalkdirService {
  /**
   * @property {number} rid - Random identifier used to generate unique keys for socket events and cancellation
   * @private
   */
  private rid: number = Math.floor(Math.random() * 1000000) + 1;

  /**
   * @property {Object} config - Static configuration for the service
   * @property {string} config.apiUrl - The API endpoint for directory walking requests
   * @property {boolean} config.syncMode - Whether the service should operate in synchronous mode (true) or async mode (false)
   * @private
   * @static
   * @readonly
   */
  private static readonly config = {
    apiUrl: "/api/walkdirsync",
    syncMode: true
  };

  /**
   * @constructor
   * @param {WalkSocketService} walkSocketService - Service for asynchronous directory walking via WebSockets
   * @param {WalkdirSyncService} walkdirSyncService - Service for synchronous directory walking via HTTP
   */
  constructor(
    private readonly walkSocketService: WalkSocketService,
    private readonly walkdirSyncService: WalkdirSyncService
  ) {
  }

  /**
   * @method forRoot
   * @description Configures the service with custom settings
   *
   * @param {Object} config - Configuration object with optional settings
   * @param {string} [config.apiUrl] - Custom API URL for directory walking requests
   * @param {boolean} [config.syncMode] - Whether to use synchronous mode (true) or asynchronous mode (false)
   *
   * @static
   * @returns {void}
   *
   * @example
   * // In your app module or initialization code:
   * WalkdirService.forRoot({
   *   apiUrl: '/custom/api/endpoint',
   *   syncMode: false // Use WebSocket-based implementation
   * });
   */
  static forRoot(config: { [key: string]: string | boolean }) {
    Object.assign(WalkdirService.config, config);
  }

  /**
   * @method walkDir
   * @description Initiates a directory walk operation to find files matching a pattern
   *
   * @param {string[]} pathes - Array of directory paths to scan
   * @param {string} filePattern - Glob pattern to match files (e.g., "** /*.txt")
   * @param {WalkCallback} callback - Function to be called with the results
   *
   * @returns {string} A cancellation key that can be used to stop the operation
   *
   * @remarks
   * This method delegates to either the synchronous or asynchronous implementation
   * based on the current configuration. It generates unique keys for data emission
   * and cancellation, which are particularly important for the WebSocket implementation.
   *
   * The default file pattern is '** /*' (all files) if none is provided.
   *
   * The callback receives WalkData objects with information about files and folders
   * found during the traversal. In synchronous mode, the callback is called once
   * with complete results. In asynchronous mode, it may be called multiple times
   * with partial results.
   *
   * @example
   * // Find all PDF files in user's documents folder
   * const cancelKey = walkdirService.walkDir(
   *   ['/home/user/documents'],
   *   '** /*.pdf',
   *   (result) => {
   *     console.log(`Found ${result.fileCount} PDFs with total size ${result.sizeSum} bytes`);
   *     if (result.last) {
   *       console.log('Finished directory traversal!');
   *     }
   *   }
   * );
   *
   * // Later, if needed, cancel the operation
   * walkdirService.cancelWalkDir(cancelKey);
   */
  walkDir(
    pathes: string[],
    filePattern: string,
    callback: WalkCallback
  ): string {
    this.rid++;
    const listenKey = `walk${this.rid}`;
    const cancelKey = `cancelwalk${this.rid}`;
    const walkParaData = new WalkParaData(pathes, filePattern, listenKey, cancelKey);
    if (!walkParaData.filePattern) walkParaData.filePattern = '**/*';

    if (WalkdirService.config.syncMode) {
      this.walkdirSyncService.walkDirSync(walkParaData, callback);
    } else {
      return this.walkSocketService.walkDir(walkParaData, callback);
    }
    return cancelKey;
  }

  /**
   * @method cancelWalkDir
   * @description Attempts to cancel an ongoing directory walk operation
   *
   * @param {string} cancelKey - The key identifying the operation to cancel (returned from walkDir)
   *
   * @returns {void|any} In async mode, returns the result of the cancellation operation
   *
   * @remarks
   * This method delegates to either the synchronous or asynchronous implementation
   * based on the current configuration. Note that cancellation in synchronous mode
   * is a no-op and doesn't actually cancel the HTTP request, while in asynchronous
   * WebSocket mode, it can effectively stop the ongoing operation.
   *
   * @example
   * const cancelKey = walkdirService.walkDir(['path/to/dir'], '** /*.js', handleResults);
   *
   * // Later, cancel the operation
   * walkdirService.cancelWalkDir(cancelKey);
   */
  cancelWalkDir(cancelKey: string) {
    if (WalkdirService.config.syncMode) {
      this.walkdirSyncService.cancelWalkDir(cancelKey);
    } else {
      return this.walkSocketService.cancelWalkDir(cancelKey);
    }
  }
}