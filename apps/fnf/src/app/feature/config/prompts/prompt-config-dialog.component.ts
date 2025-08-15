import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FnfEditorComponent} from '../../common/editor/fnf-editor.component';
import {FnfEditorOptions} from '../../common/editor/data/fnf-editor-options.interface';
import {takeWhile} from 'rxjs/operators';
import {PromptService} from '../../../service/config/prompt.service';
import {PromptDataIf} from '@fnf-data';
import {forkJoin} from 'rxjs';
import {FnfConfirmationDialogService} from '../../../common/confirmationdialog/fnf-confirmation-dialog.service';
import {PromptSelectorIf} from "./prompt-selector-if";

@Component({
  selector: 'fnf-prompt-config-dialog',
  templateUrl: './prompt-config-dialog.component.html',
  styleUrls: ['./prompt-config-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    FnfEditorComponent,
    MatIconButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromptConfigDialogComponent implements OnInit, OnDestroy {

  editorText = '';
  isValidYaml = true;
  loading = false;
  selectedPrompt: PromptSelectorIf | null = null;

  customPrompts: PromptSelectorIf[] = [];
  predefinedPrompts: PromptSelectorIf[] = [];
  allPrompts: PromptSelectorIf[] = [];

  editorOptions: Partial<FnfEditorOptions> = {
    theme: 'vs',
    language: 'yaml',
    wordWrap: 'on',
    minimap: false
  };

  private alive = true;
  private original?: PromptDataIf;

  constructor(
    private readonly dialogRef: MatDialogRef<PromptConfigDialogComponent, boolean>,
    private readonly promptService: PromptService,
    private readonly cdr: ChangeDetectorRef,
    private readonly confirmationDialogService: FnfConfirmationDialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  get isPredefinedPrompt(): boolean {
    return this.selectedPrompt ? !this.selectedPrompt.custom : false;
  }

  get canSave(): boolean {
    return this.isValidYaml && this.selectedPrompt !== null;
  }

  get isCustomPrompt(): boolean {
    return this.selectedPrompt ? this.selectedPrompt.custom : false;
  }

  get canDelete(): boolean {
    return this.isCustomPrompt && this.selectedPrompt !== null;
  }

  ngOnInit(): void {
    this.loadPromptNames();
  }

  onPromptChange(event: any): void {
    this.selectedPrompt = event.value;
    if (this.selectedPrompt) {
      this.loadPromptData(this.selectedPrompt.name);
    }
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  onEditorChange(txt: string) {
    this.editorText = txt;
    this.isValidYaml = this.validateYaml(txt);
    this.cdr.markForCheck();
  }

  loadPromptNames(): void {
    this.loading = true;
    this.cdr.markForCheck();

    forkJoin([
      this.promptService.getDefaultNames(),
      this.promptService.getCustomNames()
    ]).pipe(
      takeWhile(() => this.alive)
    ).subscribe({
      next: (result) => {
        this.predefinedPrompts = result[0].map(name => ({name, custom: false}));
        this.customPrompts = result[1].map(name => ({name, custom: true}));
        this.allPrompts = [...this.predefinedPrompts, ...this.customPrompts];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPromptData(promptName: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    // Use getDefaults() for predefined prompts, getPrompt() for custom prompts
    const serviceCall = this.isPredefinedPrompt
      ? this.promptService.getDefaults(promptName)
      : this.promptService.getPrompt(promptName);

    serviceCall.pipe(
      takeWhile(() => this.alive)
    ).subscribe({
      next: (promptData) => {
        this.setEditorFromPromptData(promptData);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onReset(): void {
    if (this.selectedPrompt) {
      this.loadPromptData(this.selectedPrompt.name);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (!this.canSave) {
      return;
    }

    const promptData = this.parseYamlToPromptData(this.editorText);
    if (!promptData) {
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.promptService.savePrompt(this.selectedPrompt!.name, promptData).pipe(
      takeWhile(() => this.alive)
    ).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  validateYaml(txt: string): boolean {
    try {
      const promptData = this.parseYamlToPromptData(txt);
      return promptData !== null &&
        typeof promptData.description === 'string' &&
        typeof promptData.prompt === 'string';
    } catch {
      return false;
    }
  }


  setEditorFromPromptData(promptData: PromptDataIf): void {
    this.original = {...promptData};
    const yamlString = `description: ${promptData.description}\nprompt: >\n  ${promptData.prompt.split('\n').join('\n  ')}`;
    this.editorText = yamlString;
    this.isValidYaml = true;
    this.cdr.markForCheck();
  }

  isResetEnabled(): boolean {
    return this.selectedPrompt !== null && !this.isPredefinedPrompt;
  }

  onResetToDefaults(): void {
    if (!this.selectedPrompt) {
      return;
    }

    this.confirmationDialogService.simpleConfirm(
      'Reset to Defaults',
      `Are you sure you want to reset "${this.selectedPrompt.name}" to default settings? This will remove your custom configuration.`,
      () => {
        this.loading = true;
        this.cdr.markForCheck();

        this.promptService.resetToDefaults(this.selectedPrompt!.name).pipe(
          takeWhile(() => this.alive)
        ).subscribe({
          next: (promptData) => {
            this.setEditorFromPromptData(promptData);
            this.loadPromptNames(); // Refresh the lists
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Failed to reset prompt:', error);
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
      }
    );
  }


  private parseYamlToPromptData(yamlText: string): PromptDataIf | null {
    try {
      // Simple YAML parsing for the specific structure we expect
      const lines = yamlText.split('\n');
      let description = '';
      let prompt = '';
      let inPromptSection = false;

      for (const line of lines) {
        if (line.startsWith('description:')) {
          description = line.substring('description:'.length).trim();
        } else if (line.startsWith('prompt:')) {
          inPromptSection = true;
          const immediateValue = line.substring('prompt:'.length).trim();
          if (immediateValue && immediateValue !== '>-' && immediateValue !== '>') {
            prompt = immediateValue;
            inPromptSection = false;
          }
        } else if (inPromptSection && line.startsWith('  ')) {
          prompt += (prompt ? '\n' : '') + line.substring(2);
        } else if (inPromptSection && line.trim() === '') {
          prompt += '\n';
        } else if (inPromptSection && !line.startsWith('  ')) {
          inPromptSection = false;
        }
      }

      return {description: description.trim(), prompt: prompt.trim()};
    } catch {
      return null;
    }
  }
}