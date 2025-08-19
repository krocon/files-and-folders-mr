import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {ShortcutService} from './config/shortcut.service';
import {ActionId} from '../domain/action/fnf-action.enum';

export interface ChordState {
  isCapturingChord: boolean;
  currentSequence: string[];
  lastKeyTime: number;
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class KeyListenerService {
  private static readonly CHORD_TIMEOUT_MS = 2000; // 2 seconds timeout for chord sequences
  private static readonly CHORD_SEPARATOR = ' '; // Space separator between chords

  private chordState: ChordState = {
    isCapturingChord: false,
    currentSequence: [],
    lastKeyTime: 0
  };

  // Subject to emit when a complete shortcut (single or chorded) is detected
  public readonly shortcutDetected$ = new Subject<ActionId>();

  // Subject to emit chord state changes for UI feedback
  public readonly chordStateChanged$ = new BehaviorSubject<ChordState>(this.chordState);

  constructor(private readonly shortcutService: ShortcutService) {
  }

  /**
   * Process a keyboard event for potential chord sequences
   * @param event The keyboard event from keyUp
   * @returns The ActionId if a complete shortcut was detected, otherwise null
   */
  processKeyEvent(event: KeyboardEvent): ActionId | null {
    const harmonizedShortcut = this.shortcutService.createHarmonizedShortcutByKeyboardEvent(event);
    console.log('[KeyListener] Harmonized shortcut:', harmonizedShortcut);

    if (!harmonizedShortcut) {
      return null;
    }

    const currentTime = Date.now();

    // Check if this is a single shortcut first
    const singleShortcutAction = this.shortcutService.getActionByKeyEvent(event);
    console.log('[KeyListener] Single shortcut action:', singleShortcutAction);
    console.log('[KeyListener] Current chord state:', this.chordState);

    if (singleShortcutAction !== 'DO_NOTHING') {
      // Check if we're in the middle of a chord sequence
      if (this.chordState.isCapturingChord) {
        console.log('[KeyListener] Adding to chord sequence:', harmonizedShortcut);
        // Add this shortcut to the sequence
        this.chordState.currentSequence.push(harmonizedShortcut);
        this.chordState.lastKeyTime = currentTime;
        this.updateChordState();

        // Check if this completes a chorded shortcut
        const chordedAction = this.getChordedAction(this.chordState.currentSequence);
        console.log('[KeyListener] Checking chorded action for sequence:', this.chordState.currentSequence, 'Result:', chordedAction);

        if (chordedAction !== 'DO_NOTHING') {
          console.log('[KeyListener] Chorded shortcut detected! Action:', chordedAction);
          this.completeChordSequence(chordedAction);
          return chordedAction;
        }

        // Continue chord sequence
        this.resetChordTimeout();
        return null;
      } else {
        console.log('[KeyListener] Starting chord sequence with:', harmonizedShortcut);
        // Start a potential chord sequence
        this.startChordSequence(harmonizedShortcut, currentTime);

        // Also check if this single shortcut should be executed immediately
        // (for backward compatibility with single shortcuts)
        this.resetChordTimeout();
        return null; // Don't execute single shortcuts immediately when starting chord
      }
    } else {
      console.log('[KeyListener] No single shortcut found for:', harmonizedShortcut);

      // Even if no single shortcut exists, we might want to start or continue a chord sequence
      if (this.chordState.isCapturingChord) {
        console.log('[KeyListener] Adding to chord sequence (no single shortcut):', harmonizedShortcut);
        // Add this shortcut to the sequence
        this.chordState.currentSequence.push(harmonizedShortcut);
        this.chordState.lastKeyTime = currentTime;
        this.updateChordState();

        // Check if this completes a chorded shortcut
        const chordedAction = this.getChordedAction(this.chordState.currentSequence);
        console.log('[KeyListener] Checking chorded action for sequence (no single):', this.chordState.currentSequence, 'Result:', chordedAction);

        if (chordedAction !== 'DO_NOTHING') {
          console.log('[KeyListener] Chorded shortcut detected! Action:', chordedAction);
          this.completeChordSequence(chordedAction);
          return chordedAction;
        }

        // Continue chord sequence
        this.resetChordTimeout();
        return null;
      } else {
        // Start a potential chord sequence even if no single shortcut exists
        console.log('[KeyListener] Starting chord sequence (no single shortcut) with:', harmonizedShortcut);
        this.startChordSequence(harmonizedShortcut, currentTime);
        this.resetChordTimeout();
        return null;
      }
    }
  }

  /**
   * Start capturing a chord sequence
   */
  private startChordSequence(firstShortcut: string, timestamp: number): void {
    this.chordState = {
      isCapturingChord: true,
      currentSequence: [firstShortcut],
      lastKeyTime: timestamp
    };
    this.updateChordState();
  }

  /**
   * Complete a chord sequence and reset state
   */
  private completeChordSequence(action: ActionId): void {
    this.clearChordTimeout();
    this.chordState = {
      isCapturingChord: false,
      currentSequence: [],
      lastKeyTime: 0
    };
    this.updateChordState();
    this.shortcutDetected$.next(action);
  }

  /**
   * Reset chord state due to timeout or cancellation
   */
  private resetChordState(): void {
    // If we have a single shortcut in the sequence, execute it
    if (this.chordState.currentSequence.length === 1) {
      const singleShortcut = this.chordState.currentSequence[0];
      const action = this.shortcutService.getActiveShortcuts()[singleShortcut];
      if (action && action !== 'DO_NOTHING') {
        this.shortcutDetected$.next(action as ActionId);
      }
    }

    this.clearChordTimeout();
    this.chordState = {
      isCapturingChord: false,
      currentSequence: [],
      lastKeyTime: 0
    };
    this.updateChordState();
  }

  /**
   * Set up timeout for chord completion
   */
  private resetChordTimeout(): void {
    this.clearChordTimeout();
    this.chordState.timeout = window.setTimeout(() => {
      this.resetChordState();
    }, KeyListenerService.CHORD_TIMEOUT_MS);
  }

  /**
   * Clear existing chord timeout
   */
  private clearChordTimeout(): void {
    if (this.chordState.timeout) {
      clearTimeout(this.chordState.timeout);
      this.chordState.timeout = undefined;
    }
  }

  /**
   * Update chord state and notify subscribers
   */
  private updateChordState(): void {
    this.chordStateChanged$.next({...this.chordState});
  }

  /**
   * Check if a sequence of shortcuts matches a chorded action
   */
  private getChordedAction(sequence: string[]): ActionId {
    if (sequence.length < 2) {
      console.log('[KeyListener] getChordedAction: sequence too short:', sequence);
      return 'DO_NOTHING';
    }

    // Create chorded shortcut string (e.g., "cmd k cmd c")
    const chordedShortcut = sequence.join(KeyListenerService.CHORD_SEPARATOR);
    console.log('[KeyListener] getChordedAction: looking up chorded shortcut:', chordedShortcut);

    // Check in active shortcuts
    const activeShortcuts = this.shortcutService.getActiveShortcuts();
    const action = activeShortcuts[chordedShortcut];
    console.log('[KeyListener] getChordedAction: found action:', action);

    // Also log some similar shortcuts for debugging
    console.log('[KeyListener] getChordedAction: available shortcuts containing "ctrl":',
      Object.keys(activeShortcuts).filter(key => key.includes('ctrl')).slice(0, 10));

    return (action as ActionId) || 'DO_NOTHING';
  }

  /**
   * Get current chord state
   */
  getCurrentChordState(): ChordState {
    return {...this.chordState};
  }

  /**
   * Cancel current chord sequence
   */
  cancelChordSequence(): void {
    this.clearChordTimeout();
    this.chordState = {
      isCapturingChord: false,
      currentSequence: [],
      lastKeyTime: 0
    };
    this.updateChordState();
  }

  /**
   * Create a chorded shortcut string from sequence
   */
  static createChordedShortcut(sequence: string[]): string {
    return sequence.join(KeyListenerService.CHORD_SEPARATOR);
  }

  /**
   * Parse a chorded shortcut string into sequence
   */
  static parseChordedShortcut(chordedShortcut: string): string[] {
    return chordedShortcut.split(KeyListenerService.CHORD_SEPARATOR).filter(s => s.trim());
  }

  /**
   * Check if a shortcut string is a chorded shortcut
   */
  static isChordedShortcut(shortcut: string): boolean {
    const parts = KeyListenerService.parseChordedShortcut(shortcut);
    return parts.length > 1;
  }
}