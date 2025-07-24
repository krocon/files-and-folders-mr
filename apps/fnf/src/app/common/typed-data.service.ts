import {BehaviorSubject} from "rxjs";
import {TypedDataOptions} from "./typed-data-options";
import {TypeDataDefaultOptions} from "./type-data-default-options";


/**
 * A generic service for handling typed data with localStorage persistence.
 *
 * The TypedDataService provides a convenient way to store and retrieve typed data from
 * localStorage with proper serialization/deserialization, change notifications, and custom data handling.
 *
 * @template T The type of data to be managed by this service
 *
 * @example
 * // Basic usage with a string value
 * const stringService = new TypedDataService<string>("user-name", "default-user");
 *
 * // Get the current value
 * const userName = stringService.getValue();
 *
 * // Update the value (persists to localStorage)
 * stringService.update("new-user-name");
 *
 * // Subscribe to changes
 * stringService.valueChanges$.subscribe(newValue => {
 *   console.log("User name changed to:", newValue);
 * });
 *
 * @example
 * // Usage with a complex object
 * interface UserPreferences {
 *   theme: string;
 *   fontSize: number;
 *   notifications: boolean;
 * }
 *
 * const defaultPreferences: UserPreferences = {
 *   theme: 'light',
 *   fontSize: 14,
 *   notifications: true
 * };
 *
 * const preferencesService = new TypedDataService<UserPreferences>(
 *   "user-preferences",
 *   defaultPreferences
 * );
 *
 * // Update a single property while preserving others
 * const currentPrefs = preferencesService.getValue();
 * preferencesService.update({
 *   ...currentPrefs,
 *   theme: 'dark'
 * });
 *
 * @example
 * // Using custom serialization/deserialization
 * interface ComplexData {
 *   createdAt: Date;
 *   items: Map<string, number>;
 * }
 *
 * const customOptions: Partial<TypedDataOptions<ComplexData>> = {
 *   stringify: (data) => {
 *     if (data === null) return null;
 *     return JSON.stringify({
 *       createdAt: data.createdAt.toISOString(),
 *       items: Array.from(data.items.entries())
 *     });
 *   },
 *   parse: (str) => {
 *     if (str === null) return null;
 *     const parsed = JSON.parse(str);
 *     const result: ComplexData = {
 *       createdAt: new Date(parsed.createdAt),
 *       items: new Map(parsed.items)
 *     };
 *     return result;
 *   },
 *   clone: (data) => {
 *     return {
 *       createdAt: new Date(data.createdAt),
 *       items: new Map(data.items)
 *     };
 *   }
 * };
 *
 * const complexDataService = new TypedDataService<ComplexData>(
 *   "complex-data",
 *   { createdAt: new Date(), items: new Map() },
 *   customOptions
 * );
 *
 * @example
 * // Real-world usage in a service
 * @Injectable({
 *   providedIn: 'root'
 * })
 * export class UserSettingsService {
 *   private readonly settingsService: TypedDataService<UserSettings>;
 *
 *   constructor() {
 *     this.settingsService = new TypedDataService<UserSettings>(
 *       'user-settings',
 *       DEFAULT_SETTINGS
 *     );
 *   }
 *
 *   getSettings(): UserSettings {
 *     return this.settingsService.getValue();
 *   }
 *
 *   updateSettings(settings: UserSettings): void {
 *     this.settingsService.update(settings);
 *   }
 *
 *   get settings$(): Observable<UserSettings> {
 *     return this.settingsService.valueChanges$.asObservable();
 *   }
 * }
 */
export class TypedDataService<T> {

  readonly valueChanges$: BehaviorSubject<T>;
  private readonly options: TypedDataOptions<T> = new TypeDataDefaultOptions<T>();

  constructor(
    private readonly key: string,
    private readonly defaultValue: T,
    private readonly _options: Partial<TypedDataOptions<T>> = new TypeDataDefaultOptions<T>()
  ) {
    if (_options.parse) this.options.parse = _options.parse;
    if (_options.stringify) this.options.stringify = _options.stringify;
    if (_options.clone) this.options.clone = _options.clone;
    if (_options.equals) this.options.equals = _options.equals;

    this.valueChanges$ = new BehaviorSubject<T>(defaultValue);
    this.init();
  }

  init() {
    const item = localStorage.getItem(this.key);
    if (!item) {
      if (this.defaultValue !== null) {
        const value = this.options.stringify(this.defaultValue);
        this.set2localStorage(value);
      } else {
        localStorage.removeItem(this.key);
      }
    }

    this.next();
  }

  update(nvObj: T): void {
    if (this.options.stringify(nvObj) !== localStorage.getItem(this.key)) {
      if (nvObj === null) {
        localStorage.removeItem(this.key);
        this.next();
      } else {
        const nv = this.options.stringify(nvObj);
        this.set2localStorage(nv);
        this.next();
      }
    }
  }

  getValue(): T {
    if (this.key) {
      const item = localStorage.getItem(this.key);
      if (item) {
        const parse = this.options.parse(item);
        if (parse !== null && parse !== undefined) {
          return parse;
        }
      }
    }
    return this.defaultValue;
  }

  private set2localStorage(s: string | null) {
    if (s) {
      localStorage.setItem(this.key, s);
    } else {
      localStorage.removeItem(this.key);
    }
  }

  private next() {
    const value = this.getValue();
    if (value || value === 0 || value === false) {
      this.valueChanges$.next(this.options.clone(value));
    }
  }


}