import {Test, TestingModule} from '@nestjs/testing';
import {WalkGateway} from './walk.gateway';
import {WalkParaData} from '@fnf-data';
import {
  cleanupTestEnvironment,
  restoreTestEnvironment,
  setupTestEnvironment
} from '../file-action/action/common/test-setup-helper';
import * as path from 'path';
import {Server} from 'socket.io';
import {FileWalker} from './file-walker';
import {AppLoggerService} from '../shared/logger.service';

// Mock FileWalker
const mockFileWalkerDispose = jest.fn();
const mockFileWalkerIsDisposedState = jest.fn().mockReturnValue(false);

jest.mock('./file-walker', () => {
  return {
    FileWalker: jest.fn().mockImplementation(() => ({
      dispose: mockFileWalkerDispose,
      isDisposedState: mockFileWalkerIsDisposedState,
    }))
  };
});

// Mock Logger
const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  logWithMetadata: jest.fn(),
} as unknown as AppLoggerService;

describe('WalkGateway', () => {
  let gateway: WalkGateway;

  // Mock for WebSocketServer
  const mockServer = {
    emit: jest.fn(),
    // Add additional properties and methods required by Server interface
    sockets: {},
    engine: {},
    httpServer: {},
    _parser: {},
    // Add any other required properties with mock implementations
  } as unknown as Server;

  // Define test paths
  const testDir = path.resolve('./test');
  const sourceDir = path.join(testDir, 'demo');

  // Setup and teardown for all tests
  beforeAll(async () => {
    // Set up the initial test environment
    await setupTestEnvironment();
  });

  afterAll(async () => {
    // Clean up the test environment after all tests
    await cleanupTestEnvironment();
  });

  // Setup and teardown for each test
  beforeEach(async () => {
    // Restore the test environment before each test
    await restoreTestEnvironment();

    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalkGateway,
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    gateway = module.get<WalkGateway>(WalkGateway);

    // Manually set the server property
    gateway['server'] = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('walkdir', () => {
    beforeEach(() => {
      mockFileWalkerDispose.mockClear();
      mockFileWalkerIsDisposedState.mockClear();
    });

    it('should create a new FileWalker instance with the provided parameters', () => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.files = [sourceDir];
      walkParaData.stepsPerMessage = 100;
      walkParaData.emmitDataKey = 'walk-data';
      walkParaData.emmitCancelKey = 'cancel-walk';

      // Act
      gateway.walkdir(walkParaData);

      // Assert
      expect(FileWalker).toHaveBeenCalledWith(
        walkParaData,
        gateway['cancellings'],
        mockServer,
        mockLogger
      );
    });

    it('should track active walker instances', () => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.files = [sourceDir];
      walkParaData.emmitCancelKey = 'test-walker-1';

      // Act
      gateway.walkdir(walkParaData);

      // Assert
      expect(gateway['activeWalkers'].size).toBe(1);
      expect(gateway['activeWalkers'].has('test-walker-1')).toBe(true);
    });

    it('should reject requests when maximum concurrent walkers reached', () => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.emmitDataKey = 'walk-data';
      walkParaData.emmitCancelKey = 'test-walker';

      // Fill up to maximum concurrent walkers
      for (let i = 0; i < 5; i++) {
        const data = new WalkParaData();
        data.emmitCancelKey = `walker-${i}`;
        gateway.walkdir(data);
      }

      // Act - try to add one more
      gateway.walkdir(walkParaData);

      // Assert
      expect(mockServer.emit).toHaveBeenCalledWith('walk-data', {
        error: 'Too many concurrent operations. Please try again later.',
        last: true
      });
      expect(gateway['activeWalkers'].size).toBe(5); // Should not exceed limit
    });

    it('should cleanup existing walker with same ID before creating new one', () => {
      // Arrange
      const walkParaData1 = new WalkParaData();
      walkParaData1.emmitCancelKey = 'same-id';

      const walkParaData2 = new WalkParaData();
      walkParaData2.emmitCancelKey = 'same-id';

      // Act
      gateway.walkdir(walkParaData1);
      gateway.walkdir(walkParaData2);

      // Assert
      expect(mockFileWalkerDispose).toHaveBeenCalled();
      expect(gateway['activeWalkers'].size).toBe(1); // Only one instance
    });

    it('should generate unique walker ID if emmitCancelKey not provided', () => {
      // Arrange
      const walkParaData = new WalkParaData();
      // emmitCancelKey is undefined

      // Act
      gateway.walkdir(walkParaData);

      // Assert
      expect(gateway['activeWalkers'].size).toBe(1);
      const walkerIds = Array.from(gateway['activeWalkers'].keys());
      expect(walkerIds[0]).toMatch(/^walker_\d+$/);
    });
  });

  describe('cancelWalk', () => {
    it('should set the cancellation flag and cleanup walker instance', () => {
      // Arrange
      const cancelId = 'test-cancel-id';
      const walkParaData = new WalkParaData();
      walkParaData.emmitCancelKey = cancelId;

      // Create a walker first
      gateway.walkdir(walkParaData);

      // Act
      gateway.cancelWalk(cancelId);

      // Assert
      expect(gateway['cancellings'][cancelId]).toBeUndefined(); // Should be cleaned up
      expect(mockFileWalkerDispose).toHaveBeenCalled();
      expect(gateway['activeWalkers'].size).toBe(0);
    });

    it('should cleanup cancellation flag after walker disposal', () => {
      // Arrange
      const cancelId = 'test-cancel-id';
      const walkParaData = new WalkParaData();
      walkParaData.emmitCancelKey = cancelId;

      gateway.walkdir(walkParaData);

      // Act
      gateway.cancelWalk(cancelId);

      // Assert
      expect(gateway['cancellings'][cancelId]).toBeUndefined();
    });
  });

  describe('memory management', () => {
    it('should provide memory statistics', () => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.emmitCancelKey = 'test-walker';
      gateway.walkdir(walkParaData);

      // Act
      const stats = gateway.getMemoryStats();

      // Assert
      expect(stats).toEqual({
        activeWalkers: 1,
        pendingCancellations: 0
      });
    });

    it('should handle walker disposal errors gracefully', () => {
      // Arrange
      mockFileWalkerDispose.mockImplementation(() => {
        throw new Error('Disposal error');
      });

      const walkParaData = new WalkParaData();
      walkParaData.emmitCancelKey = 'error-walker';
      gateway.walkdir(walkParaData);

      // Act
      gateway.cancelWalk('error-walker');

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during walker cleanup: Disposal error',
        expect.any(String),
        'WalkGateway'
      );
      expect(gateway['activeWalkers'].size).toBe(0); // Should still cleanup tracking
    });

    it('should schedule automatic cleanup after timeout', (done) => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.emmitCancelKey = 'timeout-walker';

      // Mock setTimeout to execute immediately for testing
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((callback: Function) => {
        callback();
        return 1 as any;
      }) as any;

      // Act
      gateway.walkdir(walkParaData);

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;

      // Assert - should be cleaned up immediately due to mocked setTimeout
      setImmediate(() => {
        expect(mockFileWalkerDispose).toHaveBeenCalled();
        done();
      });
    });
  });
});
