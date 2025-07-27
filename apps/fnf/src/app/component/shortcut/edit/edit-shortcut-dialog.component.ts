import {Component, Inject, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, AfterViewInit} from "@angular/core";
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

export interface EditShortcutDialogData {
  actionItem: ActionIdLabelShortcut;
  osType: BrowserOsType;
}

@Component({
  selector: "fnf-edit-shortcut-dialog",
  templateUrl: "./edit-shortcut-dialog.component.html",
  styleUrls: ["./edit-shortcut-dialog.component.css"],
  imports: [
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
    MatIconButton,
  ],
  standalone: true,
})
export class EditShortcutDialogComponent implements OnInit, OnDestroy {

  shortcuts: string[] = [];
  currentShortcutInput = '';
  isCapturingShortcut = false;
  captureIndex = -1;

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

  private startCapturingShortcut(index: number): void {
    this.isCapturingShortcut = true;
    this.captureIndex = index;
    this.currentShortcutInput = '';
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (!this.isCapturingShortcut) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const harmonizedShortcut = this.shortcutService.createHarmonizedShortcutByKeyboardEvent(event);
    if (harmonizedShortcut && this.captureIndex >= 0) {
      this.shortcuts[this.captureIndex] = harmonizedShortcut;
      this.isCapturingShortcut = false;
      this.captureIndex = -1;
      this.currentShortcutInput = '';
    }
  }

  ngOnDestroy(): void {
    // Clean up any ongoing capture state
    this.isCapturingShortcut = false;
    this.captureIndex = -1;
  }

  onStopCapturing(): void {
    this.isCapturingShortcut = false;
    this.captureIndex = -1;
    this.currentShortcutInput = '';
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
}
