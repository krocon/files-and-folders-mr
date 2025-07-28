import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from "@angular/core";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {PackDialogData, PackDialogResultData} from "@fnf-data";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {WalkData} from "@fnf-data";

import {takeWhile} from "rxjs/operators";
import {MatError, MatFormField, MatInput, MatSuffix, MatLabel} from "@angular/material/input";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FnfAutofocusDirective} from "../../../common/directive/fnf-autofocus.directive";
import {MatDivider} from "@angular/material/divider";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {AppService} from "../../../app.service";
import {getAllParents} from "../../../common/fn/get-all-parents.fn";
import {WalkDataComponent} from "../../../common/walkdir/walk-data.component";
import {WalkdirService} from "../../../common/walkdir/walkdir.service";
import {MatOption, MatSelect} from "@angular/material/select";
import {CommonModule} from "@angular/common";

@Component({
  selector: "fnf-pack-dialog",
  templateUrl: "./pack-dialog.component.html",
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    MatIconModule,
    MatInput,
    MatButton,
    MatDialogActions,
    MatFormField,
    MatLabel,
    FnfAutofocusDirective,
    MatError,
    MatDivider,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatSuffix,
    MatMenuTrigger,
    WalkDataComponent,
    MatSelect,
    MatOption
  ],
  styleUrls: ["./pack-dialog.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackDialogComponent implements OnInit, OnDestroy {

  suggestions: string[] = [];
  availableFormats = [
    { value: '7z', label: '7-Zip (.7z)' },
    { value: 'zip', label: 'ZIP (.zip)' },
    { value: 'tar', label: 'TAR (.tar)' },
    { value: 'gzip', label: 'GZIP (.tar.gz)' }
  ];

  formGroup: FormGroup;
  error = "";
  errorMesasage = "";
  walkData = new WalkData(0, 0, 0, false);
  walkCancelKey = '';

  title = "Pack";
  source = "";
  sourceTooltip = "";

  private alive = true;

  constructor(
    public dialogRef: MatDialogRef<PackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PackDialogData,
    private readonly formBuilder: FormBuilder,
    private readonly walkdirService: WalkdirService,
    private readonly cdr: ChangeDetectorRef,
    private readonly appService: AppService,
  ) {
    if (data.source.length > 1) {
      this.source = data.source.length + " items";
    } else {
      this.source = data.source[0];
    }
    this.sourceTooltip = data.source.join("\n");

    this.formGroup = this.formBuilder.group(
      {
        targetFilename: new FormControl(data.targetFilename || this.generateDefaultFilename(),
          [
            Validators.required,
            Validators.minLength(1),
            Validators.pattern(/^(?!tabfind).*$/)
          ]),
        targetDirectory: new FormControl(data.targetDirectory, [Validators.required]),
        password: new FormControl(data.password, []),
        format: new FormControl(data.format || '7z', [Validators.required]),
        compressionLevel: new FormControl(data.compressionLevel || 5, [Validators.required])
      }
    );

    dialogRef
      .afterOpened()
      .pipe(takeWhile(() => this.alive))
      .subscribe(() => {
        // Focus on target filename field
      });
    dialogRef
      .afterClosed()
      .subscribe(result => {
        if (this.walkCancelKey) {
          this.walkdirService.cancelWalkDir(this.walkCancelKey);
        }
      });
  }

  get hasError(): boolean {
    return false;
  }

  ngOnDestroy(): void {
    this.alive = false;
    this.walkdirService.cancelWalkDir(this.walkCancelKey);
  }

  ngOnInit(): void {
    this.alive = true;
    // start scanning selected files/folders:
    this.walkCancelKey = this.walkdirService
      .walkDir(
        this.data.source,
        '**/*',
        (walkData: WalkData) => {
          this.walkData = walkData;
          this.cdr.detectChanges();
        });
    this.createSuggestions();
  }

  onSuggestionClicked(suggestion: string) {
    this.formGroup.patchValue({targetDirectory: suggestion}, {emitEvent: true});
  }

  onOkClicked() {
    const formData = this.formGroup.getRawValue();
    const result = new PackDialogResultData(
      this.data.source,
      formData.targetFilename,
      formData.targetDirectory,
      formData.password,
      formData.format,
      formData.compressionLevel
    );
    this.dialogRef.close(result);
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }

  onFormatChange() {
    const format = this.formGroup.get('format')?.value;
    const targetFilename = this.formGroup.get('targetFilename')?.value;
    
    if (targetFilename && !targetFilename.endsWith(this.getExtensionForFormat(format))) {
      const baseName = targetFilename.replace(/\.[^/.]+$/, '');
      const newFilename = baseName + this.getExtensionForFormat(format);
      this.formGroup.patchValue({targetFilename: newFilename});
    }
  }

  private getExtensionForFormat(format: string): string {
    const extensions: Record<string, string> = {
      '7z': '.7z',
      'zip': '.zip',
      'tar': '.tar',
      'gzip': '.tar.gz'
    };
    return extensions[format] || '.7z';
  }

  private generateDefaultFilename(): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `archive_${timestamp}.7z`;
  }

  private createSuggestions() {
    const dirs = [...new Set([
      ...this.appService.latest,
      ...this.appService.favs
    ])];

    const dirs2: string[] = [];
    for (const dir of dirs) {
      dirs2.push(dir);
      getAllParents(dir).forEach(
        (parent: string) => {
          if (!dirs2.includes(parent)) {
            dirs2.push(parent);
          }
        }
      )
      dirs2.push()
    }
    this.suggestions = [...new Set(dirs2)].sort();
  }
} 