/**
 * A method decorator that implements debouncing functionality to limit how often a method can be invoked.
 *
 * Debouncing ensures that a method is only executed after a specified time has passed since its last invocation.
 * This is particularly useful for methods triggered by frequent events like user input, window resizing, or
 * continuous data updates to improve performance and prevent excessive function calls.
 *
 * @param wait - The time in milliseconds to wait before executing the decorated method after its last invocation.
 *               Defaults to 300ms if not specified.
 *
 * @example
 * ```typescript
 * import { Component } from '@angular/core';
 * import { DebounceTime } from '../common/decorators/debounce-time.decorator';
 *
 * @Component({
 *   selector: 'app-search',
 *   template: `
 *     <input type="text" (input)="onSearch($event.target.value)" placeholder="Search...">
 *     <div *ngIf="loading">Searching...</div>
 *     <div *ngFor="let result of searchResults">{{ result.name }}</div>
 *   `
 * })
 * export class SearchComponent {
 *   loading = false;
 *   searchResults = [];
 *
 *   // This method will only execute 500ms after the user stops typing
 *   @DebounceTime(500)
 *   onSearch(query: string) {
 *     this.loading = true;
 *     this.fetchSearchResults(query)
 *       .then(results => {
 *         this.searchResults = results;
 *         this.loading = false;
 *       });
 *   }
 *
 *   private fetchSearchResults(query: string): Promise<any[]> {
 *     // API call or data processing logic
 *     return fetch(`/api/search?q=${query}`)
 *       .then(response => response.json());
 *   }
 * }
 * ```
 *
 * @remarks
 * - Each instance of the class maintains its own debounce timer for each decorated method.
 * - If the method is called multiple times within the wait period, only the last call will be executed.
 * - The original context (`this`) and arguments are preserved when the method is finally executed.
 * - This decorator is ideal for:
 *   - Search input handlers
 *   - Window resize event handlers
 *   - Scroll event handlers
 *   - Any event that can fire rapidly in succession
 *
 * @returns A method decorator function that replaces the original method with a debounced version.
 */
export function DebounceTime(wait: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const debounceTimeoutKey = Symbol(`${propertyKey}DebounceTimeout`);

    descriptor.value = function (...args: any[]) {
      // Clear the existing timeout (if any)
      const existingTimeout = (this as any)[debounceTimeoutKey];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set a new timeout
      (this as any)[debounceTimeoutKey] = setTimeout(() => {
        originalMethod.apply(this, args);
        (this as any)[debounceTimeoutKey] = null;
      }, wait);
    };

    return descriptor;
  };
}