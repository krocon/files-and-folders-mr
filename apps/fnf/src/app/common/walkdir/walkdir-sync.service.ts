import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {WalkData, WalkParaData} from "@fnf-data";
import {WalkCallback} from "./walk.socketio.service";


/**
 * @class WalkdirSyncService
 * @description A service that provides synchronous directory walking functionality via HTTP requests.
 * This service is part of a directory traversal system that allows for collecting file and folder statistics
 * by recursively walking through specified directories.
 *
 * @injectable Provided at the root level of the application.
 *
 * @remarks
 * This service implements the synchronous version of directory walking by making HTTP POST requests
 * to a configured API endpoint. It works in conjunction with the `WalkdirService` which can choose
 * between this synchronous implementation and a WebSocket-based asynchronous implementation
 * depending on configuration.
 *
 * Unlike the WebSocket implementation, this service doesn't actually support cancellation
 * despite exposing a `cancelWalkDir` method (which is a no-op).
 *
 * @example
 * // Basic usage with Angular dependency injection
 * constructor(private walkdirSyncService: WalkdirSyncService) {}
 *
 * // Process data about files in a directory
 * const walkParaData = new WalkParaData(
 *   ['/path/to/directory'],  // Array of directory paths to scan
 *   '** /*.txt',              // File pattern to match (glob format)
 *   'uniqueDataKey',         // Emission data key (not used in sync version)
 *   'uniqueCancelKey',       // Cancellation key (not used in sync version)
 *   1000                     // Steps per message (batch size)
 * );
 *
 * this.walkdirSyncService.walkDirSync(walkParaData, (walkData: WalkData) => {
 *   console.log(`Found ${walkData.fileCount} files in ${walkData.folderCount} folders`);
 *   console.log(`Total size: ${walkData.sizeSum} bytes`);
 *
 *   if (walkData.last) {
 *     console.log('Finished walking directory!');
 *   }
 * });
 *
 * @example
 * // Configuring the service globally
 * // In your app module or configuration
 * WalkdirSyncService.forRoot({
 *   apiUrl: '/custom/api/path',
 *   syncMode: true
 * });
 */
@Injectable({
  providedIn: "root"
})
export class WalkdirSyncService {

  /**
   * @property {Object} config - Static configuration for the service
   * @property {string} config.apiUrl - The API endpoint for directory walking requests
   * @property {boolean} config.syncMode - Whether the service should operate in synchronous mode
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
   * @param {HttpClient} httpClient - The Angular HttpClient for making API requests
   */
  constructor(private readonly httpClient: HttpClient) {
  }

  /**
   * @method forRoot
   * @description Configures the service with custom settings
   *
   * @param {Object} config - Configuration object with optional settings
   * @param {string} [config.apiUrl] - Custom API URL for directory walking requests
   * @param {boolean} [config.syncMode] - Whether to use synchronous mode
   *
   * @static
   * @returns {void}
   *
   * @example
   * WalkdirSyncService.forRoot({
   *   apiUrl: '/custom/api/endpoint',
   *   syncMode: true
   * });
   */
  static forRoot(config: { [key: string]: string | boolean }) {
    Object.assign(WalkdirSyncService.config, config);
  }

  /**
   * @method walkDirSync
   * @description Performs a synchronous directory walk operation via HTTP POST request
   *
   * @param {WalkParaData} data - The parameters for the walk operation
   * @param {WalkCallback} callback - Callback function to handle the walk results
   *
   * @returns {void}
   *
   * @remarks
   * This method sends the walk parameters to the server via a POST request and calls
   * the provided callback with the results. The callback will be invoked once when
   * the request completes. The subscription is automatically cleaned up after the
   * callback is invoked.
   *
   * The WalkParaData contains:
   * - files: Array of directory paths to walk
   * - filePattern: Glob pattern to match files (e.g., "** /*.txt")
   * - emmitDataKey: A key for data emission (not used in sync mode)
   * - emmitCancelKey: A key for cancellation (not used in sync mode)
   * - stepsPerMessage: Number of steps to process per message (batch size)
   *
   * The callback receives a WalkData object with:
   * - fileCount: Number of files found
   * - folderCount: Number of folders found
   * - sizeSum: Total size of files in bytes
   * - last: Boolean indicating if this is the last batch
   * - timestamp: Timestamp of when the data was created
   * - rn: Random number or sequence number
   *
   * @example
   * const walkParams = new WalkParaData(
   *   ['/home/user/documents'],
   *   '** /*.pdf',
   *   'data-key',
   *   'cancel-key',
   *   500
   * );
   *
   * walkdirSyncService.walkDirSync(walkParams, (result) => {
   *   console.log(`Found ${result.fileCount} PDF files with total size ${result.sizeSum} bytes`);
   * });
   */
  walkDirSync(
    data: WalkParaData,
    callback: WalkCallback): void {

    const sub = this.httpClient
      .post<WalkData>(
        WalkdirSyncService.config.apiUrl,
        data
      )
      .subscribe((walkData: WalkData) => {
        callback(walkData);
        sub.unsubscribe();
      });
  }

  /**
   * @method cancelWalkDir
   * @description Attempts to cancel an ongoing directory walk operation
   *
   * @param {string} cancelKey - The key identifying the operation to cancel
   *
   * @returns {void}
   *
   * @remarks
   * This method is a no-op in the synchronous implementation and does not
   * actually cancel anything. It exists to maintain API compatibility with
   * the asynchronous WebSocket-based implementation.
   *
   * In the synchronous HTTP implementation, there's no practical way to cancel
   * an in-progress HTTP request reliably across all browsers, so this method
   * does nothing.
   *
   * @example
   * // This won't actually do anything in the sync implementation
   * walkdirSyncService.cancelWalkDir('some-cancel-key');
   */
  cancelWalkDir(cancelKey: string) {
    // nothing
  }
}
