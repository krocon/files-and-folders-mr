import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,} from "@angular/core";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from "@angular/material/dialog";
import {MatError, MatFormField, MatInput} from "@angular/material/input";
import {MatButton} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FnfAutofocusDirective} from "../../../common/directive/fnf-autofocus.directive";
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption
} from "@angular/material/autocomplete";
import {actionIds} from "../../../domain/action/fnf-action.enum";


@Component({
  selector: "fnf-call-action-dialog",
  templateUrl: "./call-action-dialog.component.html",
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    MatIconModule,
    MatButton,
    MatDialogActions,
    MatFormField,
    FnfAutofocusDirective,
    MatError,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatInput,
  ],
  styleUrls: ["./call-action-dialog.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallActionDialogComponent implements OnInit {

  formGroup: FormGroup;
  error = "";
  errorMesasage = "";
  target = "";
  filteredOptions: string[] = actionIds;

  constructor(
    public dialogRef: MatDialogRef<CallActionDialogComponent>,
    private readonly formBuilder: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {
    // this.openTabDirsOptions.push(...data.dirs.map(s => new CallActionOptionData('cd', s)))
    this.formGroup = this.formBuilder.group(
      {
        target: new FormControl('', [Validators.required, Validators.minLength(1)])
      }
    );
  }


  get hasError(): boolean {
    return false;
  }

  displayFn(option: string | undefined): string {
    return option ?? '';
  };

  onOkClicked() {
    this.dialogRef.close(this.formGroup.getRawValue().target.toUpperCase());
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }


  ngOnInit(): void {
    this.updateSearchTerm(this.formGroup.getRawValue().target.toUpperCase());
  }

  onOptionSelected(evt: MatAutocompleteSelectedEvent) {
    this.formGroup.patchValue({target: evt.option.value}, {emitEvent: true});
    this.cdr.detectChanges();
  }

  onKeyup(_evt: KeyboardEvent) {
    let target = this.formGroup.getRawValue().target.toUpperCase();
    this.updateSearchTerm(target);
  }

  private updateSearchTerm(value: string): void {
    if (!value) value = '';

    this.filteredOptions = actionIds.filter(id => id.toUpperCase().includes(value.toUpperCase()));
  }
}
