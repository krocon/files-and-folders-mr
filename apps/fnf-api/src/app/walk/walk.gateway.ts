import {MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Server} from "socket.io";
import {environment} from "../../environments/environment";
import {WalkParaData} from "@fnf-data";
import {FileWalker} from "./file-walker";
import {AppLoggerService} from "../shared/logger.service";

@WebSocketGateway(environment.websocketPort, environment.websocketOptions)
export class WalkGateway {

  @WebSocketServer() server: Server;
  private readonly cancellings = {};
  private readonly activeWalkers = new Map<string, FileWalker>();
  private readonly MAX_CONCURRENT_WALKERS = 5; // Limit concurrent operations

  constructor(private readonly logger: AppLoggerService) {
  }


  /**
   * Traverses directories and emits events containing information about the processed files and directories.
   * The method processes directories and files, updating statistical data, and emits updates periodically
   * based on the specified steps per message.
   *
   * @param {WalkParaData} walkParaData - An object containing parameters needed for the directory traversal.
   *    - `stepsPerMessage` (number): Determines the interval for emitting progress updates.
   *    - `files` (string[]): A list of file/directory paths to be processed.
   *    - `emmitDataKey` (string): The key used to emit progress data updates.
   *    - `emmitCancelKey` (string): The key used to monitor cancellation requests.
   *
   * @return {void} This function does not return a value; it emits updates to the server instead.
   */
  @SubscribeMessage("walkdir")
  walkdir(@MessageBody() walkParaData: WalkParaData): void {
    const walkerId = walkParaData.emmitCancelKey || `walker_${Date.now()}`;

    // Check for concurrent walker limit
    if (this.activeWalkers.size >= this.MAX_CONCURRENT_WALKERS) {
      this.logger.warn(
        `Maximum concurrent walkers (${this.MAX_CONCURRENT_WALKERS}) reached. Rejecting new request.`,
        'WalkGateway'
      );
      this.server.emit(walkParaData.emmitDataKey, {
        error: 'Too many concurrent operations. Please try again later.',
        last: true
      });
      return;
    }

    // Cleanup any existing walker with the same ID
    this.cleanupWalker(walkerId);

    // Create new FileWalker instance
    const walker = new FileWalker(walkParaData, this.cancellings, this.server, this.logger);

    // Track the active walker
    this.activeWalkers.set(walkerId, walker);

    this.logger.log(
      `Started new FileWalker (${walkerId}). Active walkers: ${this.activeWalkers.size}`,
      'WalkGateway'
    );

    // Schedule cleanup after a reasonable timeout (30 minutes)
    setTimeout(() => {
      this.cleanupWalker(walkerId);
    }, 30 * 60 * 1000);
  }

  @SubscribeMessage("cancelwalk")
  cancelWalk(@MessageBody() cancelId: string): void {
    this.cancellings[cancelId] = cancelId;

    // Also cleanup the walker instance immediately
    this.cleanupWalker(cancelId);

    this.logger.log(`Cancelled walker: ${cancelId}`, 'WalkGateway');
  }

  /**
   * Cleanup a specific walker instance and remove from tracking
   */
  private cleanupWalker(walkerId: string): void {
    const walker = this.activeWalkers.get(walkerId);
    if (walker) {
      try {
        // Dispose the walker to free resources
        walker.dispose();

        this.logger.log(
          `Cleaned up walker: ${walkerId}. Active walkers: ${this.activeWalkers.size - 1}`,
          'WalkGateway'
        );
      } catch (error) {
        this.logger.error(
          `Error during walker cleanup: ${error.message}`,
          error.stack,
          'WalkGateway'
        );
      }

      // Always remove from active tracking, even if disposal fails
      this.activeWalkers.delete(walkerId);
    }

    // Also cleanup the cancellation flag to prevent memory leaks
    if (this.cancellings[walkerId]) {
      delete this.cancellings[walkerId];
    }
  }

  /**
   * Cleanup all active walkers (useful for shutdown)
   */
  private cleanupAllWalkers(): void {
    this.logger.log(`Cleaning up ${this.activeWalkers.size} active walkers`, 'WalkGateway');

    for (const [walkerId, walker] of this.activeWalkers) {
      try {
        walker.dispose();
      } catch (error) {
        this.logger.error(
          `Error disposing walker ${walkerId}: ${error.message}`,
          error.stack,
          'WalkGateway'
        );
      }
    }

    this.activeWalkers.clear();

    // Clear all cancellation flags
    Object.keys(this.cancellings).forEach(key => {
      delete this.cancellings[key];
    });
  }

  /**
   * Get memory usage statistics for monitoring
   */
  public getMemoryStats(): { activeWalkers: number; pendingCancellations: number } {
    return {
      activeWalkers: this.activeWalkers.size,
      pendingCancellations: Object.keys(this.cancellings).length
    };
  }

}
