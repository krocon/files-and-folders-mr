import {Component, HostListener, Inject, OnDestroy, OnInit} from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {ActionIdLabelShortcut} from "../action-id-label-shortcut";
import {ShortcutComponent} from "../../main/footer/buttonpanel/shortcut/shortcut.component";
import {ShortcutService} from "../../../service/config/shortcut.service";
import {BrowserOsType} from "@fnf-data";
import {CommonModule} from "@angular/common";

export interface EditShortcutDialogData {
  actionItem: ActionIdLabelShortcut;
  osType: BrowserOsType;
}

@Component({
  selector: "fnf-edit-shortcut-dialog",
  templateUrl: "./edit-shortcut-dialog.component.html",
  styleUrls: ["./edit-shortcut-dialog.component.css"],
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ShortcutComponent,
    MatIconButton
  ],
  standalone: true,
})
export class EditShortcutDialogComponent implements OnInit, OnDestroy {

  shortcuts: string[] = [];
  currentShortcutInput = '';
  isCapturingShortcut = false;
  captureIndex = -1;
  capturedChordSequence: string[] = []; // For displaying captured chord sequence in template
  private captureTimeout: any = null; // Keep for cleanup only

  constructor(
    public readonly dialogRef: MatDialogRef<EditShortcutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: EditShortcutDialogData,
    private readonly shortcutService: ShortcutService,
  ) {
  }

  ngOnInit(): void {
    // Clone the shortcuts array to avoid modifying the original
    this.shortcuts = [...this.data.actionItem.shortcuts];
  }

  onAddShortcut(): void {
    this.shortcuts.push('');
    this.startCapturingShortcut(this.shortcuts.length - 1);
  }

  onEditShortcut(index: number): void {
    this.startCapturingShortcut(index);
  }

  onRemoveShortcut(index: number): void {
    this.shortcuts.splice(index, 1);
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (!this.isCapturingShortcut) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Check if Enter key was pressed to finalize chord sequence
    if (event.key === 'Enter') {
      this.finalizeChordSequence();
      return;
    }

    // Check if ESC key was pressed to cancel capture
    if (event.key === 'Escape') {
      this.cancelCapture();
      return;
    }

    // Skip if it's just modifier keys without any other key pressed
    if (['Control', 'Alt', 'Shift', 'Meta', 'Cmd'].includes(event.key) &&
      !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
      return;
    }

    const harmonizedShortcut = this.shortcutService.createHarmonizedShortcutByKeyboardEvent(event);
    if (harmonizedShortcut && this.captureIndex >= 0) {
      // Immediately add the keystroke to the chord sequence - no timeout!
      // This eliminates timing issues and race conditions
      this.capturedChordSequence.push(harmonizedShortcut);

      // Update display to show the current building sequence with correct formatting
      this.currentShortcutInput = this.capturedChordSequence.map(chord => {
        // Replace spaces with plus signs within individual chords for display
        return chord.replace(/\s+/g, '+');
      }).join(' ');

      // Clear any leftover timeout (shouldn't be needed anymore)
      if (this.captureTimeout) {
        clearTimeout(this.captureTimeout);
        this.captureTimeout = null;
      }
    }
  }

  ngOnDestroy(): void {
    // Clean up any ongoing capture state
    this.isCapturingShortcut = false;
    this.captureIndex = -1;
    this.capturedChordSequence = [];

    // Clear timeout to prevent memory leaks
    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout);
      this.captureTimeout = null;
    }
  }

  onStopCapturing(): void {
    // With the new immediate capture approach, just finalize what we have
    if (this.capturedChordSequence.length > 0) {
      this.finalizeChordSequence();
    } else {
      // Otherwise, just clean up the state
      this.cleanupCaptureState();
    }
  }

  private cancelCapture(): void {
    // ESC was pressed - cancel the current capture without saving
    console.log('Capture cancelled by user (ESC pressed)');
    this.cleanupCaptureState();
  }

  onReset(): void {
    // Reset to original shortcuts from the service
    this.shortcuts = [...this.data.actionItem.shortcuts];
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Filter out empty shortcuts
    const validShortcuts = this.shortcuts.filter(shortcut => shortcut.trim() !== '');

    // Update the action item with new shortcuts
    const updatedItem: ActionIdLabelShortcut = {
      ...this.data.actionItem,
      shortcuts: validShortcuts
    };

    // Get the complete current shortcut mapping for this OS type
    const currentShortcuts = this.shortcutService.getActiveShortcuts();

    // Create a new mapping by removing old shortcuts for this action and adding new ones
    const updatedShortcutMapping: { [key: string]: string } = {};

    // Copy all existing shortcuts except those for the current action
    Object.entries(currentShortcuts).forEach(([shortcut, actionId]) => {
      if (actionId !== this.data.actionItem.actionId) {
        updatedShortcutMapping[shortcut] = actionId;
      }
    });

    // Add the new shortcuts for the current action
    validShortcuts.forEach(shortcut => {
      updatedShortcutMapping[shortcut] = this.data.actionItem.actionId;
    });

    // Save the complete mapping through the service
    this.shortcutService.saveShortcuts(this.data.osType, updatedShortcutMapping).subscribe({
      next: () => {
        this.dialogRef.close(updatedItem);
      },
      error: (error) => {
        console.error('Failed to save shortcuts:', error);
      }
    });
  }

  private startCapturingShortcut(index: number): void {
    this.isCapturingShortcut = true;
    this.captureIndex = index;
    this.currentShortcutInput = '';
    this.capturedChordSequence = [];

    // Clear any existing timeout
    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout);
      this.captureTimeout = null;
    }
  }


  private finalizeChordSequence(): void {
    if (this.captureIndex >= 0 && this.capturedChordSequence.length > 0) {
      // Format individual chords with plus signs, then join chord sequences with spaces
      const finalShortcut = this.capturedChordSequence.map(chord => {
        // Replace spaces with plus signs within individual chords
        return chord.replace(/\s+/g, '+');
      }).join(' ');
      this.shortcuts[this.captureIndex] = finalShortcut;
      console.log(`Finalized shortcut: "${finalShortcut}"`);
    } else if (this.captureIndex >= 0) {
      // No chords captured, clear the shortcut
      this.shortcuts[this.captureIndex] = '';
    }

    this.cleanupCaptureState();
  }

  private cleanupCaptureState(): void {
    // Reset all capture state
    this.isCapturingShortcut = false;
    this.captureIndex = -1;
    this.currentShortcutInput = '';
    this.capturedChordSequence = [];

    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout);
      this.captureTimeout = null;
    }
  }

  getShortcutAsLabelTokens(shortcut: string): string[] {
    return this.shortcutService.getShortcutAsLabelTokens(shortcut);
  }

}
