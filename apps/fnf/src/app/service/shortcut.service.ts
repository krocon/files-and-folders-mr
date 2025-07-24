import {Injectable} from "@angular/core";
import {ActionId, createHarmonizedShortcutByKeyboardEvent, harmonizeShortcut} from "@guiexpert/table";
import {HttpClient} from "@angular/common/http";
import {BrowserOsType} from "@fnf/fnf-data";
import {Observable, of} from "rxjs";
import {catchError, map, tap} from "rxjs/operators";

export type ShortcutActionMapping = { [key: string]: string };


@Injectable({
  providedIn: "root"
})
export class ShortcutService {

  private static readonly config = {
    getShortcutActionMappingUrl: "assets/config/shortcut/",
    getShortcutApiUrl: "api/shortcuts"  /* on localhost: is automatically set to by configuration "http://localhost:3333/api/shortcut/" */
  };

  // Initialize with default shortcuts to ensure something is available before init() is called
  private activeShortcuts: ShortcutActionMapping = {};

  constructor(
    private readonly httpClient: HttpClient,
  ) {
  }

  static forRoot(config: { [key: string]: string }) {
    Object.assign(ShortcutService.config, config);
  }

  getShortcuts(sys: BrowserOsType): Observable<ShortcutActionMapping | undefined> {
    return this.getShortcutsFromApi(sys);
    // return this.fetchShortcutMappings(sys)
    //   .pipe(
    //     tap(shortcutMappings => {
    //       if (shortcutMappings) {
    //         this.activeShortcuts = this.updateShortcutMappings(shortcutMappings);
    //       }
    //     })
    //   );
  }


  createHarmonizedShortcutByKeyboardEvent(keyboardEvent: KeyboardEvent): string {
    return createHarmonizedShortcutByKeyboardEvent(keyboardEvent)
      .split(' ')
      .filter(s => s)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .join(' ');
  }

  getActionByKeyEvent(keyboardEvent: KeyboardEvent): ActionId {
    const shortcut = this.createHarmonizedShortcutByKeyboardEvent(keyboardEvent);

    // Look up the action in activeShortcuts
    let action = this.activeShortcuts[shortcut] as ActionId;
    return action ?? 'DO_NOTHING';
  }

  getShortcutsByAction(action: string): string[] {
    const ret: string[] = [];
    for (const sc in this.activeShortcuts) {
      const a = this.activeShortcuts[sc];
      if (a === action) {
        ret.push(harmonizeShortcut(sc));
      }
    }
    return ret;
  }

  getFirstShortcutByActionAsTokens(action: string): string[] {
    for (const sc in this.activeShortcuts) {
      const a = this.activeShortcuts[sc];
      if (a === action) {
        return this.getShortcutAsLabelTokens(sc);
      }
    }
    return [];
  }

  getShortcutAsLabelTokens(sc: string): string[] {
    const hs = harmonizeShortcut(sc);
    return hs
      .replace('num_', 'num ')
      .split(' ')
      .map(s => s
        .replace(/ctrl/g, '^')
        .replace(/shift/g, '⇧')
        .replace(/cmd/g, '⌘')
        .replace(/add/g, '+')
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/subtract/g, '-')
        .replace(/multiply/g, '*')
        .replace(/minus/g, '-')
      );
  }

  getActiveShortcuts(): ShortcutActionMapping {
    return this.activeShortcuts;
  }

  public addAdditionalShortcutMappings(map: ShortcutActionMapping): void {
    Object.entries(map).forEach(([key, value]) => {
      if (this.activeShortcuts[harmonizeShortcut(key)]) {
        console.warn('Shortcut already exists:' + harmonizeShortcut(key));
        console.warn(this.activeShortcuts[harmonizeShortcut(key)], value);
        // throw new Error(
        //   'Shortcut already exists:' + harmonizeShortcut(key) +
        //   ' - ' + this.activeShortcuts[harmonizeShortcut(key)] +
        //   ' - ' + value
        // )
      }
      this.activeShortcuts[harmonizeShortcut(key)] = value;
    });
  }

  /**
   * Get shortcuts from the new API (merged defaults + custom)
   */
  getShortcutsFromApi(os: BrowserOsType): Observable<ShortcutActionMapping> {
    return this.httpClient.get<ShortcutActionMapping>(`${ShortcutService.config.getShortcutApiUrl}/${os}`)
      .pipe(
        tap(shortcuts => {
          this.activeShortcuts = this.updateShortcutMappings(shortcuts);
        }),
        catchError(error => {
          console.error('Failed to load shortcuts from API:', error);
          // Fallback to old method
          return this.fetchShortcutMappings(os).pipe(
            map(shortcuts => shortcuts || {}),
            tap(shortcuts => {
              this.activeShortcuts = this.updateShortcutMappings(shortcuts);
            })
          );
        })
      );
  }

  /**
   * Save custom shortcuts for a specific OS
   */
  saveShortcuts(os: BrowserOsType, shortcuts: ShortcutActionMapping): Observable<{
    success: boolean;
    message: string
  }> {
    console.info('Saving shortcuts for OS', os, shortcuts);
    return this.httpClient.put<{
      success: boolean;
      message: string
    }>(`${ShortcutService.config.getShortcutApiUrl}/${os}`, shortcuts)
      .pipe(
        tap(response => {
          if (response.success) {
            // Update active shortcuts with the saved ones
            this.activeShortcuts = this.updateShortcutMappings(shortcuts);
          }
        }),
        catchError(error => {
          console.error('Failed to save shortcuts:', error);
          return of({success: false, message: 'Failed to save shortcuts'});
        })
      );
  }

  // New methods for shortcut editing functionality

  /**
   * Reset shortcuts to defaults for a specific OS
   */
  resetToDefaults(os: BrowserOsType): Observable<ShortcutActionMapping> {
    return this.httpClient.post<ShortcutActionMapping>(`${ShortcutService.config.getShortcutApiUrl}/${os}/reset`, {})
      .pipe(
        tap(shortcuts => {
          this.activeShortcuts = this.updateShortcutMappings(shortcuts);
        }),
        catchError(error => {
          console.error('Failed to reset shortcuts:', error);
          // Fallback to loading defaults from assets
          return this.fetchShortcutMappings(os).pipe(
            map(shortcuts => shortcuts || {}),
            tap(shortcuts => {
              this.activeShortcuts = this.updateShortcutMappings(shortcuts);
            })
          );
        })
      );
  }

  /**
   * Get default shortcuts for a specific OS
   */
  getDefaults(os: BrowserOsType): Observable<ShortcutActionMapping> {
    return this.httpClient.get<ShortcutActionMapping>(`${ShortcutService.config.getShortcutApiUrl}/${os}/defaults`)
      .pipe(
        catchError(error => {
          console.error('Failed to load default shortcuts:', error);
          // Fallback to loading from assets
          return this.fetchShortcutMappings(os).pipe(
            map(shortcuts => shortcuts || {})
          );
        })
      );
  }

  /**
   * Validate shortcut conflicts
   */
  validateShortcuts(shortcuts: ShortcutActionMapping): { valid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];
    const shortcutKeys = Object.keys(shortcuts);

    // Check for duplicate shortcuts
    const shortcutCounts = new Map<string, string[]>();

    Object.entries(shortcuts).forEach(([shortcut, action]) => {
      const harmonized = harmonizeShortcut(shortcut);
      if (!shortcutCounts.has(harmonized)) {
        shortcutCounts.set(harmonized, []);
      }
      shortcutCounts.get(harmonized)!.push(action);
    });

    shortcutCounts.forEach((actions, shortcut) => {
      if (actions.length > 1) {
        const uniqueActions = [...new Set(actions)];
        if (uniqueActions.length > 1) {
          conflicts.push(`Shortcut "${shortcut}" is assigned to multiple actions: ${uniqueActions.join(', ')}`);
        }
      }
    });

    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  debug() {
    console.info('active shortcuts', this.activeShortcuts);
  }

  private fetchShortcutMappings(sys: BrowserOsType): Observable<ShortcutActionMapping | undefined> {
    return this.httpClient.get<ShortcutActionMapping>(ShortcutService.config.getShortcutActionMappingUrl + sys + '.json');
  }

  private updateShortcutMappings(fetchedMappings: ShortcutActionMapping): ShortcutActionMapping {
    const updatedMappings: ShortcutActionMapping = {...this.activeShortcuts};

    Object.entries(fetchedMappings).forEach(([key, value]) => {
      updatedMappings[harmonizeShortcut(key)] = value;
    });

    return updatedMappings;
  }
}
