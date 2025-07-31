import {Test, TestingModule} from '@nestjs/testing';
import {ShellGateway} from './shell.gateway';
import {ShellCancelSpawnParaIf, ShellSpawnParaIf} from '@fnf-data';

let activeTimeouts = [];

describe('ShellGateway', () => {
  let gateway: ShellGateway;
  let mockServer: any;

  beforeEach(async () => {
    jest.useFakeTimers();
    
    // Mock the WebSocket server
    mockServer = {
      emit: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShellGateway],
    }).compile();

    gateway = module.get<ShellGateway>(ShellGateway);
    gateway.server = mockServer;
  });

  afterEach(() => {
    // Clean up any running processes
    if (gateway['spawnManager']) {
      gateway['spawnManager'].killAllProcesses();
    }

    // Clear all timers
    jest.runAllTimers();
    jest.useRealTimers();
  });

  describe('doSpawn', () => {
    it('should spawn a process and emit results', (done) => {
      const para: ShellSpawnParaIf = {
        cmd: 'echo "Test Output"',
        emitKey: 'test-output',
        cancelKey: 'test-cancel',
        timeout: 5000
      };

      // Mock the server emit to capture the results
      mockServer.emit = jest.fn((key, result) => {
        expect(key).toBe(para.emitKey);
        expect(result).toHaveProperty('out');
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('code');
        expect(result).toHaveProperty('done');

        if (result.done) {
          expect(result.code).toBe(0);
          done();
        }
      });

      gateway.doSpawn(para);
    });
    /*
        it('should handle multiple concurrent processes', (done) => {
          const para1: ShellSpawnParaIf = {
            cmd: 'echo "Process 1"',
            emitKey: 'test-output-1',
            cancelKey: 'test-cancel-1',
            timeout: 5000
          };

          const para2: ShellSpawnParaIf = {
            cmd: 'echo "Process 2"',
            emitKey: 'test-output-2',
            cancelKey: 'test-cancel-2',
            timeout: 5000
          };

          const emittedKeys: string[] = [];
          mockServer.emit = jest.fn((key, result) => {
            emittedKeys.push(key);
          });

          gateway.doSpawn(para1);
          gateway.doSpawn(para2);

          // Give some time for processes to start
          const timeoutId = setTimeout(() => {
            expect(emittedKeys).toContain(para1.emitKey);
            expect(emittedKeys).toContain(para2.emitKey);
            done();
          }, 100);
          activeTimeouts.push(timeoutId);
        });
        */
  });


  describe('error handling', () => {
    it('should handle invalid commands gracefully', (done) => {
      const para: ShellSpawnParaIf = {
        cmd: 'invalidcommandthatdoesnotexist',
        emitKey: 'test-error',
        cancelKey: 'test-cancel',
        timeout: 5000
      };

      let errorReceived = false;
      mockServer.emit = jest.fn((key, result) => {
        // Check for error in stderr output
        if (!result.done && result.error && result.error.trim()) {
          errorReceived = true;
        }

        if (result.done) {
          expect(result.code).not.toBe(0);
          // Error might be in the error field or we might have received stderr output
          expect(errorReceived || result.error.trim() || result.code === 127).toBeTruthy();
          done();
        }
      });

      gateway.doSpawn(para);
    });

  });
});
