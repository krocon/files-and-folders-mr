import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {PromptService} from './prompt.service';
import {PromptDataIf} from '@fnf-data';

describe('PromptService', () => {
  let service: PromptService;
  let httpMock: HttpTestingController;

  const mockPromptData: PromptDataIf = {
    prompt: 'Test prompt content',
    description: 'Test description'
  };

  beforeEach(() => {
    // Reset the service config to default before each test
    PromptService.forRoot({apiUrl: 'api/prompts'});

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PromptService]
    });
    service = TestBed.inject(PromptService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('forRoot', () => {
    it('should configure the service with provided config', () => {
      const config = {apiUrl: 'custom/api/url'};
      PromptService.forRoot(config);

      // Access the private config through service methods to verify it was set
      service.getCustomNames().subscribe();
      const req = httpMock.expectOne('custom/api/url/customnames');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getCustomNames', () => {
    it('should return custom names', () => {
      const mockNames = ['custom1', 'custom2', 'custom3'];

      service.getCustomNames().subscribe(names => {
        expect(names).toEqual(mockNames);
      });

      const req = httpMock.expectOne('api/prompts/customnames');
      expect(req.request.method).toBe('GET');
      req.flush(mockNames);
    });
  });

  describe('getDefaultNames', () => {
    it('should return default names', () => {
      const mockNames = ['default1', 'default2', 'default3'];

      service.getDefaultNames().subscribe(names => {
        expect(names).toEqual(mockNames);
      });

      const req = httpMock.expectOne('api/prompts/getdefaultnames');
      expect(req.request.method).toBe('GET');
      req.flush(mockNames);
    });
  });

  describe('getPrompt', () => {
    it('should return prompt data for given key', () => {
      const key = 'test-key';

      service.getPrompt(key).subscribe(prompt => {
        expect(prompt).toEqual(mockPromptData);
      });

      const req = httpMock.expectOne(`api/prompts/${key}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPromptData);
    });
  });

  describe('getDefaults', () => {
    it('should return default prompt data for given key', () => {
      const key = 'test-key';
      const mockDefaultData = {...mockPromptData, prompt: 'Default prompt content'};

      service.getDefaults(key).subscribe(prompt => {
        expect(prompt).toEqual(mockDefaultData);
      });

      const req = httpMock.expectOne(`api/prompts/${key}/defaults`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDefaultData);
    });
  });

  describe('savePrompt', () => {
    it('should save prompt and return success response', () => {
      const key = 'test-key';
      const mockResponse = {success: true, message: 'Prompt saved successfully'};

      service.savePrompt(key, mockPromptData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`api/prompts/${key}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockPromptData);
      req.flush(mockResponse);
    });

    it('should handle save failure', () => {
      const key = 'test-key';
      const mockErrorResponse = {success: false, message: 'Failed to save prompt'};

      service.savePrompt(key, mockPromptData).subscribe(response => {
        expect(response).toEqual(mockErrorResponse);
      });

      const req = httpMock.expectOne(`api/prompts/${key}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockErrorResponse);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset prompt to defaults', () => {
      const key = 'test-key';
      const mockDefaultData = {...mockPromptData, prompt: 'Reset to default content'};

      service.resetToDefaults(key).subscribe(prompt => {
        expect(prompt).toEqual(mockDefaultData);
      });

      const req = httpMock.expectOne(`api/prompts/${key}/reset`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockDefaultData);
    });
  });
});