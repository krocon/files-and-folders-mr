import {TestBed} from '@angular/core/testing';
import {SetupDataService} from './setup-data.service';
import {SetupPersistentService} from './setup-persistent.service';
import {SetupData} from '@fnf-data';
import {of, throwError} from 'rxjs';

describe('SetupDataService', () => {
  let service: SetupDataService;
  let mockPersistentService: any;

  const mockSetupData = new SetupData(
    true,  // openAboutInNewWindow
    false, // openSetupInNewWindow
    true,  // openServerShellInNewWindow
    false, // openManageShortcutsInNewWindow
    true,  // loadFolderSizeAfterSelection
    false  // condensedPresentationStyle
  );

  const defaultSetupData = new SetupData();

  beforeEach(() => {
    mockPersistentService = {
      getSetupData: jest.fn(),
      resetToDefaults: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        SetupDataService,
        {provide: SetupPersistentService, useValue: mockPersistentService}
      ]
    });

    service = TestBed.inject(SetupDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should initialize with data from persistent service', (done) => {
      mockPersistentService.getSetupData.mockReturnValue(of(mockSetupData));

      service.init().subscribe(setupData => {
        expect(setupData).toEqual(mockSetupData);
        expect(service.isInitialized()).toBe(true);
        expect(service.getCurrentValue()).toEqual(mockSetupData);
        done();
      });

      expect(mockPersistentService.getSetupData).toHaveBeenCalled();
    });

    it('should handle plain object response from persistent service', (done) => {
      const plainObject = mockSetupData;
      mockPersistentService.getSetupData.mockReturnValue(of(plainObject as any));

      service.init().subscribe(setupData => {
        expect(setupData.openAboutInNewWindow).toBe(mockSetupData.openAboutInNewWindow);
        expect(setupData.openSetupInNewWindow).toBe(mockSetupData.openSetupInNewWindow);
        expect(service.isInitialized()).toBe(true);
        done();
      });
    });

    it('should return current data if already initialized', (done) => {
      // First initialization
      mockPersistentService.getSetupData.mockReturnValue(of(mockSetupData));

      service.init().subscribe(() => {
        // Second call should return current data without calling persistent service again
        service.init().subscribe(setupData => {
          expect(setupData).toEqual(mockSetupData);
          expect(mockPersistentService.getSetupData).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should handle initialization error', (done) => {
      const error = new Error('Network error');
      mockPersistentService.getSetupData.mockReturnValue(throwError(() => error));

      service.init().subscribe({
        next: () => fail('Should not succeed'),
        error: (err) => {
          expect(err).toBe(error);
          expect(service.isInitialized()).toBe(false);
          done();
        }
      });
    });
  });

  describe('getCurrentData', () => {
    it('should return current data as observable', (done) => {
      mockPersistentService.getSetupData.mockReturnValue(of(mockSetupData));

      service.init().subscribe(() => {
        service.getCurrentData().subscribe(setupData => {
          expect(setupData).toEqual(mockSetupData);
          done();
        });
      });
    });
  });

  describe('getCurrentValue', () => {
    it('should return current data value synchronously', () => {
      // Initially should return defaults
      const currentValue = service.getCurrentValue();
      expect(currentValue).toEqual(defaultSetupData);
    });

    it('should return updated value after initialization', (done) => {
      mockPersistentService.getSetupData.mockReturnValue(of(mockSetupData));

      service.init().subscribe(() => {
        const currentValue = service.getCurrentValue();
        expect(currentValue).toEqual(mockSetupData);
        done();
      });
    });
  });

  describe('updateData', () => {
    it('should update the current data', (done) => {
      const newSetupData = new SetupData(false, true, false, true, false, true);

      service.updateData(newSetupData);

      service.getCurrentData().subscribe(setupData => {
        expect(setupData).toEqual(newSetupData);
        expect(service.getCurrentValue()).toEqual(newSetupData);
        done();
      });
    });
  });

  describe('resetToDefaults', () => {
    it('should reset to defaults via persistent service', (done) => {
      const defaultData = new SetupData();
      mockPersistentService.resetToDefaults.mockReturnValue(of(defaultData));

      service.resetToDefaults().subscribe(setupData => {
        expect(setupData).toEqual(defaultData);
        expect(service.getCurrentValue()).toEqual(defaultData);
        done();
      });

      expect(mockPersistentService.resetToDefaults).toHaveBeenCalled();
    });

    it('should handle plain object response from reset', (done) => {
      const defaultData = new SetupData();
      mockPersistentService.resetToDefaults.mockReturnValue(of(defaultData));

      service.resetToDefaults().subscribe(setupData => {
        expect(setupData.openAboutInNewWindow).toBe(defaultData.openAboutInNewWindow);
        expect(setupData.openSetupInNewWindow).toBe(defaultData.openSetupInNewWindow);
        done();
      });
    });
  });

  describe('reload', () => {
    it('should reload data from persistent service', (done) => {
      const newData = new SetupData(true, true, false, false, true, true);
      mockPersistentService.getSetupData.mockReturnValue(of(newData));

      service.reload().subscribe(setupData => {
        expect(setupData).toEqual(newData);
        expect(service.getCurrentValue()).toEqual(newData);
        done();
      });

      expect(mockPersistentService.getSetupData).toHaveBeenCalled();
    });
  });

  describe('isInitialized', () => {
    it('should return false initially', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', (done) => {
      mockPersistentService.getSetupData.mockReturnValue(of(mockSetupData));

      service.init().subscribe(() => {
        expect(service.isInitialized()).toBe(true);
        done();
      });
    });
  });
});