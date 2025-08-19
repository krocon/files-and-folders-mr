import {Injectable} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ConvertPara, ConvertResponseType} from '@fnf-data';
import {PromptService} from '../../config/prompt/prompt.service';

@Injectable()
export class Llama3_7bService {
  // Get API endpoint and model from environment variables
  private readonly apiUrl = environment.llamaApiUrl;
  private readonly model = environment.llamaModel;

  constructor(
    private readonly httpService: HttpService,
    private readonly promptService: PromptService
  ) {
  }

  async hasApiKey(): Promise<boolean> {
    // Check if Llama API key is available
    return !!environment.llamaApiKey;
  }

  async convertFilenames(para: ConvertPara): Promise<ConvertResponseType> {
    const promptData = await this.promptService.getPrompt('convert_filenames');
    const prompt = promptData.prompt;

    return this.processLlamaRequest(para.files, prompt);
  }

  async groupfiles(para: ConvertPara): Promise<ConvertResponseType> {
    const promptData = await this.promptService.getPrompt('group_filenames');
    const prompt = promptData.prompt;

    return this.processLlamaRequest(para.files, prompt);
  }

  /**
   * Process a request to Llama 3 7B API with the given files and prompt
   * @param files Array of filenames to process
   * @param promptTemplate The prompt template to use for the request
   * @returns Converted response from Llama
   * @throws Error if Llama API key is missing or authentication fails
   */
  private async processLlamaRequest(files: string[], promptTemplate: string): Promise<ConvertResponseType> {
    this.validateApiKey();

    const fileList = files.join('\n');
    const prompt = promptTemplate + fileList;

    const headers = {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${environment.llamaApiKey}`,
    };

    // This body structure might need to be adjusted based on the actual Llama API requirements
    const body = {
      model: this.model,
      prompt,
      stream: false
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, body, {headers}),
      );

      try {
        // This parsing logic might need to be adjusted based on the actual Llama API response format
        const s = response.data.response;

        return JSON.parse(s.replace(/Here is the JSON output:/g, '').trim());

      } catch (e) {
        console.log('Llama response:', response.data.response);
        console.error('Error parsing Llama response:', e);
        return {'error': e + ''};
      }
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Validate that the Llama API key is present
   * @throws Error if the API key is missing
   */
  private validateApiKey(): void {
    if (!environment.llamaApiKey) {
      throw new Error('Llama API key is missing. Please set the FNF_LLAMA_API_KEY environment variable.');
    }
  }

  /**
   * Handle errors from the Llama API
   * @param error The error object from the API call
   * @throws Error with appropriate message based on the error type
   */
  private handleApiError(error: any): never {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error with Llama API:', error);
      throw new Error('Authentication failed with Llama API. Please check your API key.');
    }
    console.error('Error calling Llama API:', error);
    throw error;
  }
}
