import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from "@angular/core";
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MatOptionModule} from "@angular/material/core";
import {ShortcutService} from "../../service/config/shortcut.service";
import {actionIds, PSEUDO_ACTIONS} from "../../domain/action/fnf-action.enum";
import {ActionIdLabelShortcut} from "./action-id-label-shortcut";
import {FnfActionLabels} from "../../domain/action/fnf-action-labels";
import {ShortcutComponent} from "../main/footer/buttonpanel/shortcut/shortcut.component";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {BrowserOsType} from "@fnf-data";
import {debounceTime, distinctUntilChanged, Subject, Subscription} from "rxjs";
import {EditShortcutDialogComponent, EditShortcutDialogData} from "./edit/edit-shortcut-dialog.component";
import {BrowserOsService} from "../../service/browseros/browser-os.service";

@Component({
  selector: "fnf-shortcut--dialog",
  templateUrl: "./shortcut-dialog.component.html",
  styleUrls: ["./shortcut-dialog.component.css"],
  imports: [
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatIconModule,
    MatButton,
    MatDialogActions,
    ShortcutComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconButton,
    MatSelectModule,
    MatOptionModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShortcutDialogComponent implements OnInit, OnDestroy {

  actionIdLabelShortcuts: ActionIdLabelShortcut[] = [];
  allActionIdLabelShortcuts: ActionIdLabelShortcut[] = [];
  filterText = '';
  selectedOsType: BrowserOsType = 'osx';
  browserOs: BrowserOsType = 'osx';

  private filterTextChanged = new Subject<string>();
  private subscription: Subscription | null = null;


  constructor(
    private readonly shortcutService: ShortcutService,
    private readonly browserOsService: BrowserOsService,
    private readonly dialogRef: MatDialogRef<ShortcutDialogComponent>,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    this.subscription = this.filterTextChanged
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filterText => {
        this.applyFilter(filterText);
      });

    this.loadShortcutsForOsType(this.selectedOsType);
    this.browserOs = this.browserOsService.browserOs;
  }

  onOsTypeChange(event: any): void {
    this.selectedOsType = event.value;
    this.loadShortcutsForOsType(this.selectedOsType);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterTextChanged.next(input.value.trim());
  }

  resetFilter(): void {
    this.filterText = '';
    this.actionIdLabelShortcuts = [...this.allActionIdLabelShortcuts];
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }

  openEditDialog(item: ActionIdLabelShortcut) {
    const dialogData: EditShortcutDialogData = {
      actionItem: item,
      osType: this.selectedOsType
    };

    const dialogRef = this.dialog.open(EditShortcutDialogComponent, {
      width: '700px',
      minHeight: '550px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((updatedItem: ActionIdLabelShortcut | undefined) => {
      if (updatedItem) {
        // Update the item in our arrays
        const index = this.allActionIdLabelShortcuts.findIndex(i => i.actionId === updatedItem.actionId);
        if (index >= 0) {
          this.allActionIdLabelShortcuts[index] = updatedItem;
        }

        // Refresh the filtered list
        this.applyFilter(this.filterText);
      }
    });
  }

  private loadShortcutsForOsType(osType: BrowserOsType): void {
    this.shortcutService
      .getShortcutsFromApi(osType)
      .subscribe(
        (shortcuts) => {
          console.log('shortcuts', shortcuts);
          this.allActionIdLabelShortcuts = actionIds
            .filter(id => !PSEUDO_ACTIONS.includes(id))
            .map(
              id => new ActionIdLabelShortcut(
                id,
                FnfActionLabels.actionIdLabelMap[id],
                this.shortcutService.getShortcutsByAction(id)
              )
            );
          this.actionIdLabelShortcuts = [...this.allActionIdLabelShortcuts];
          this.applyFilter(this.filterText);
          this.cdr.detectChanges();
        }
      );
  }

  private applyFilter(filterText: string): void {
    if (!filterText.trim()) {
      // all:
      this.actionIdLabelShortcuts = [...this.allActionIdLabelShortcuts];

    } else {
      const lowerCaseFilter = filterText.toLowerCase();
      this.actionIdLabelShortcuts = this.allActionIdLabelShortcuts.filter(item =>
        item.actionId.toLowerCase().includes(lowerCaseFilter) ||
        item.label?.toLowerCase().includes(lowerCaseFilter) ||
        item.shortcuts?.some(shortcut => shortcut.toLowerCase().includes(lowerCaseFilter))
      );
    }
    this.cdr.detectChanges();
  }
}
