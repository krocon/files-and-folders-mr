import {Injectable} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ConvertPara, ConvertResponseType} from '@fnf-data';
import {PromptService} from '../../config/prompt/prompt.service';

@Injectable()
export class OpenAiCompletionService {
  constructor(
    private readonly httpService: HttpService,
    private readonly promptService: PromptService
  ) {
  }

  async hasApiKey(): Promise<boolean> {
    return !!environment.openaiApiKey;
  }

  async convertFilenames(para: ConvertPara): Promise<ConvertResponseType> {
    const promptData = await this.promptService.getPrompt('convert_filenames');
    const prompt = promptData.prompt;

    return this.processOpenAiRequest(para.files, prompt);
  }

  async groupfiles(para: ConvertPara): Promise<ConvertResponseType> {
    const promptData = await this.promptService.getPrompt('group_filenames');
    const prompt = promptData.prompt;

    return this.processOpenAiRequest(para.files, prompt);
  }

  /**
   * Process a request to OpenAI API with the given files and prompt
   * @param files Array of filenames to process
   * @param promptTemplate The prompt template to use for the request
   * @returns Converted response from OpenAI
   * @throws Error if OpenAI API key is missing or authentication fails
   */
  private async processOpenAiRequest(files: string[], promptTemplate: string): Promise<ConvertResponseType> {
    this.validateApiKey();

    const fileList = files.join('\n');
    const prompt = promptTemplate + fileList;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openaiApiKey}`,
    };

    const body = {
      model: environment.openaiModel,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(environment.openaiApiUrl, body, {headers}),
      );

      try {
        const reply = response.data.choices?.[0]?.message?.content;
        return JSON.parse(reply.replace(/Output:/g, '').trim());
      } catch (e) {
        console.error('Error parsing OpenAI response:', e);
        return {'error': e + ''};
      }
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Validate that the OpenAI API key is present
   * @throws Error if the API key is missing
   */
  private validateApiKey(): void {
    if (!environment.openaiApiKey) {
      throw new Error('OpenAI API key is missing. Please set the FNF_OPENAI_API_KEY environment variable.');
    }
  }

  /**
   * Handle errors from the OpenAI API
   * @param error The error object from the API call
   * @throws Error with appropriate message based on the error type
   */
  private handleApiError(error: any): never {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error with OpenAI API:', error);
      throw new Error('Authentication failed with OpenAI API. Please check your API key.');
    }
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
