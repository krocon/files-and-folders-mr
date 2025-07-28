import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from "@angular/core";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DownloadDialogData, DownloadDialogResultData} from "@fnf-data";
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
  selector: "fnf-download-dialog",
  templateUrl: "./download-dialog.component.html",
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
  styleUrls: ["./download-dialog.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadDialogComponent implements OnInit, OnDestroy {

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

  title = "Download";
  source = "";
  sourceTooltip = "";
  isSingleFile = false;

  private alive = true;

  constructor(
    public dialogRef: MatDialogRef<DownloadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DownloadDialogData,
    private readonly formBuilder: FormBuilder,
    private readonly walkdirService: WalkdirService,
    private readonly cdr: ChangeDetectorRef,
    private readonly appService: AppService,
  ) {
    this.isSingleFile = data.source.length === 1;
    
    if (data.source.length > 1) {
      this.source = data.source.length + " items";
    } else {
      this.source = data.source[0];
    }
    this.sourceTooltip = data.source.join("\n");

    if (this.isSingleFile) {
      // Single file - no form needed, just show info
      this.formGroup = this.formBuilder.group({});
    } else {
      // Multiple files - need form for archive options
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
    }

    dialogRef
      .afterOpened()
      .pipe(takeWhile(() => this.alive))
      .subscribe(() => {
        // Focus on target filename field if multiple files
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
    if (!this.isSingleFile) {
      this.formGroup.patchValue({targetDirectory: suggestion}, {emitEvent: true});
    }
  }

  onOkClicked() {
    if (this.isSingleFile) {
      // Single file download - use original filename
      const result = new DownloadDialogResultData(
        this.data.source,
        this.data.source[0].split('/').pop() || 'download',
        "", // No target directory for single file
        "", // No password for single file
        "", // No format for single file
        0 // No compression for single file
      );
      this.dialogRef.close(result);
    } else {
      // Multiple files - use form data
      const formData = this.formGroup.getRawValue();
      const result = new DownloadDialogResultData(
        this.data.source,
        formData.targetFilename,
        formData.targetDirectory,
        formData.password,
        formData.format,
        formData.compressionLevel
      );
      this.dialogRef.close(result);
    }
  }

  onCancelClicked() {
    this.dialogRef.close(undefined);
  }

  onFormatChange() {
    if (this.isSingleFile) return;
    
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
    return `download_${timestamp}.7z`;
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