import {Subject} from "rxjs";

/**
 * @class TypedEventService
 * @description A generic service for typed event handling based on RxJS Subjects.
 *
 * The `TypedEventService` provides a strongly-typed way to create observable event streams
 * in Angular applications. It wraps an RxJS Subject with proper typing to ensure type safety
 * throughout the event publishing and subscription process.
 *
 * This service is designed to be extended by concrete implementations that define specific
 * event types. The generic type parameter `T` allows for strong typing of the data being passed
 * through the event stream.
 *
 * @template T The type of data that will be emitted through the Subject
 *
 * @example
 * // Define a custom event type
 * interface UserEvent {
 *   userId: string;
 *   action: 'login' | 'logout' | 'update';
 *   timestamp: number;
 * }
 *
 * // Create a service that extends TypedEventService with the specific event type
 * @Injectable({
 *   providedIn: 'root'
 * })
 * export class UserEventService extends TypedEventService<UserEvent> {
 *   // You can add additional methods specific to user events if needed
 * }
 *
 * // In a component or service that publishes events:
 * constructor(private userEventService: UserEventService) {}
 *
 * userLoggedIn(userId: string): void {
 *   this.userEventService.next({
 *     userId,
 *     action: 'login',
 *     timestamp: Date.now()
 *   });
 * }
 *
 * // In a component that subscribes to events:
 * constructor(private userEventService: UserEventService) {
 *   this.userEventService.valueChanges().subscribe(event => {
 *     console.log(`User ${event.userId} performed ${event.action} at ${new Date(event.timestamp)}`);
 *   });
 * }
 *
 * @see Subject from RxJS library for more information about the underlying implementation
 */
export class TypedEventService<T> {
  /**
   * The private Subject instance that handles the event stream
   * @private
   */
  private valueChanges$: Subject<T> = new Subject();

  /**
   * Returns the Subject that emits values of type T
   *
   * This method provides access to the underlying Subject, allowing consumers
   * to subscribe to the event stream.
   *
   * @returns {Subject<T>} The Subject instance that emits values of type T
   *
   * @example
   * // Subscribe to events with type safety
   * userEventService.valueChanges().subscribe(event => {
   *   // event is typed as UserEvent
   *   if (event.action === 'login') {
   *     // Handle login event
   *   }
   * });
   *
   * // You can also use operators
   * userEventService.valueChanges()
   *   .pipe(
   *     filter(event => event.action === 'login'),
   *     map(event => event.userId)
   *   )
   *   .subscribe(userId => {
   *     console.log(`User ${userId} logged in`);
   *   });
   */
  public valueChanges(): Subject<T> {
    return this.valueChanges$;
  }

  /**
   * Emits a new value to all subscribers of the Subject
   *
   * This method allows publishers to emit events of type T to all subscribers.
   *
   * @param {T} o The value to emit to subscribers
   * @returns {void}
   *
   * @example
   * // Emit a new event
   * userEventService.next({
   *   userId: '123',
   *   action: 'update',
   *   timestamp: Date.now()
   * });
   */
  public next(o: T): void {
    this.valueChanges$.next(o);
  }
}