import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {SetupPersistentService} from './setup-persistent.service';
import {SetupData} from '@fnf-data';

describe('SetupPersistentService', () => {
  let service: SetupPersistentService;
  let httpMock: HttpTestingController;

  const mockSetupData = new SetupData(
    false, // openAboutInNewWindow
    false, // openSetupInNewWindow
    true,  // openServerShellInNewWindow
    true,  // openManageShortcutsInNewWindow
    false, // loadFolderSizeAfterSelection
    false  // condensedPresentationStyle
  );

  beforeEach(() => {
    // Reset the service config to default before each test
    SetupPersistentService.forRoot({apiUrl: '/api/setup'});

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SetupPersistentService]
    });
    service = TestBed.inject(SetupPersistentService);
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
      const config = {apiUrl: '/custom/api/setup'};
      SetupPersistentService.forRoot(config);

      // Access the private config through service methods to verify it was set
      service.getSetupData().subscribe();
      const req = httpMock.expectOne('/custom/api/setup');
      expect(req.request.method).toBe('GET');
      req.flush(JSON.stringify(mockSetupData));
    });
  });

  describe('getSetupData', () => {
    it('should return setup data', () => {
      service.getSetupData().subscribe(setupData => {
        expect(setupData).toEqual(JSON.stringify(mockSetupData));
      });

      const req = httpMock.expectOne('/api/setup');
      expect(req.request.method).toBe('GET');
      req.flush(JSON.stringify(mockSetupData));
    });
  });

  describe('getDefaultSetupData', () => {
    it('should return default setup data', () => {
      const defaultData = new SetupData();

      service.getDefaultSetupData().subscribe(setupData => {
        expect(setupData).toEqual(JSON.stringify(defaultData));
      });

      const req = httpMock.expectOne('/api/setup/defaults');
      expect(req.request.method).toBe('GET');
      req.flush(JSON.stringify(defaultData));
    });
  });

  describe('saveSetupData', () => {
    it('should save setup data and return success response', () => {
      const mockResponse = {success: true, message: 'Setup data saved'};

      service.saveSetupData(mockSetupData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/setup');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockSetupData);
      req.flush(mockResponse);
    });

    it('should handle save failure', () => {
      const mockErrorResponse = {success: false, message: 'Failed to save setup data'};

      service.saveSetupData(mockSetupData).subscribe(response => {
        expect(response).toEqual(mockErrorResponse);
      });

      const req = httpMock.expectOne('/api/setup');
      expect(req.request.method).toBe('PUT');
      req.flush(mockErrorResponse);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset setup data to defaults', () => {
      const defaultData = new SetupData();

      service.resetToDefaults().subscribe(setupData => {
        expect(setupData).toEqual(JSON.stringify(defaultData));
      });

      const req = httpMock.expectOne('/api/setup/reset');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(JSON.stringify(defaultData));
    });
  });
});