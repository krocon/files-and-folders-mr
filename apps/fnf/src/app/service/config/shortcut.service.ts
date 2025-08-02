import {Injectable} from "@angular/core";
import {ActionId, createHarmonizedShortcutByKeyboardEvent, harmonizeShortcut} from "@guiexpert/table";
import {HttpClient} from "@angular/common/http";
import {BrowserOsType} from "@fnf-data";
import {Observable, of} from "rxjs";
import {catchError, map, tap} from "rxjs/operators";
import {MetaKeys} from "../../domain/meta-keys.if";

export type ShortcutActionMapping = { [key: string]: string };


@Injectable({
  providedIn: "root"
})
export class ShortcutService {

  private static readonly config = {
    apiUrl: "api/shortcuts"  /* on localhost: is automatically set to by configuration "http://localhost:3333/api/shortcut/" */
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


  /**
   * Retrieves the simplest shortcut representation for a given action while excluding meta keys that are currently pressed.
   *
   * This method searches through active shortcuts to find those associated with the specified action.
   * If the corresponding meta keys (Ctrl, Alt, Cmd, Shift) are currently pressed, they are removed from the shortcut
   * representation. This is useful for displaying shortcuts in UI elements where you want to show only the
   * key that needs to be pressed next, rather than showing keys that are already being held down.
   *
   * For example, if the shortcut is "ctrl+a" and the Ctrl key is already pressed (metaKeys.ctrl = true),
   * this method will return only ["a"] instead of ["^", "a"].
   *
   * @param action - The action identifier to find shortcuts for
   * @param metaKeys - An object containing boolean flags for currently pressed meta keys:
   *                  {ctrl: boolean, alt: boolean, cmd: boolean, shift: boolean}
   * @returns An array of string tokens representing the simplest form of the shortcut with pressed meta keys removed.
   *          Returns an empty array if no matching shortcut is found or if the shortcut contains multiple tokens
   *          after removing the pressed meta keys.
   *
   * @example
   * // If 'OPEN_FILE' action is mapped to 'ctrl+o' and Ctrl key is pressed:
   * const metaKeys = { ctrl: true, alt: false, cmd: false, shift: false };
   * const result = getSimplestShortcutsByAction('OPEN_FILE', metaKeys);
   * // result will be ["o"]
   *
   * @example
   * // If 'SAVE_FILE' action is mapped to 'ctrl+s' and no meta keys are pressed:
   * const metaKeys = { ctrl: false, alt: false, cmd: false, shift: false };
   * const result = getSimplestShortcutsByAction('SAVE_FILE', metaKeys);
   * // result will be [] since the shortcut contains multiple tokens after processing
   */
  getSimplestShortcutsByAction(action: string, metaKeys?: MetaKeys): string[] {
    for (let sc in this.activeShortcuts) {
      const a = this.activeShortcuts[sc];
      if (a === action) {

        if (metaKeys) {
          if (metaKeys.ctrl) sc = sc.replaceAll('ctrl', '');
          if (metaKeys.alt) sc = sc.replaceAll('alt', '');
          if (metaKeys.cmd) sc = sc.replaceAll('cmd', '');
          if (metaKeys.shift) sc = sc.replaceAll('shift', '');
        }
        let shortcutAsLabelTokens = this.getShortcutAsLabelTokens(sc);

        if (shortcutAsLabelTokens.length === 1) {
          return shortcutAsLabelTokens;
        }
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
    return this.httpClient
      .get<ShortcutActionMapping>(`${ShortcutService.config.apiUrl}/${os}`)
      .pipe(
        tap(shortcuts => {
          this.activeShortcuts = shortcuts; // no merge! this.updateShortcutMappings(shortcuts);
        }),
        catchError(error => {
          console.error('Failed to load shortcuts from API:', error);
          // Fallback to old method
          return this.fetchShortcutMappings(os)
            .pipe(
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
    }>(`${ShortcutService.config.apiUrl}/${os}`, shortcuts)
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
    return this.httpClient.post<ShortcutActionMapping>(`${ShortcutService.config.apiUrl}/${os}/reset`, {})
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
    return this.httpClient.get<ShortcutActionMapping>(`${ShortcutService.config.apiUrl}/${os}/defaults`)
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
    return this.getShortcutsFromApi(sys);
  }

  private updateShortcutMappings(fetchedMappings: ShortcutActionMapping): ShortcutActionMapping {
    const updatedMappings: ShortcutActionMapping = {...this.activeShortcuts};

    Object.entries(fetchedMappings).forEach(([key, value]) => {
      updatedMappings[harmonizeShortcut(key)] = value;
    });

    return updatedMappings;
  }
}
