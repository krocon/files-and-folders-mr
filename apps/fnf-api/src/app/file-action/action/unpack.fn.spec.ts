import {unpack} from './unpack.fn';
import {FileItem, FilePara} from '@fnf-data';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as fs from 'fs';
import {extractFull} from 'node-7z';
import {cleanupTestEnvironment, restoreTestEnvironment, setupTestEnvironment} from './common/test-setup-helper';

// Mock 7zip-bin
jest.mock('7zip-bin', () => ({
  default: {
    path7za: '/mock/path/to/7za'
  },
  path7za: '/mock/path/to/7za'
}));

// Mock fs to prevent warnings about missing 7zip binary
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  chmodSync: jest.fn()
}));

/**
 * Test suite for the unpack function
 * This function extracts the contents of an archive file to a target directory using node-7z
 */
describe('unpack', () => {
  // Define test paths
  const testDir = path.resolve('./test');
  const sourceDir = path.join(testDir, 'demo');
  const targetDir = path.join(testDir, 'target');
  const zipFile = 'test-archive.zip';

  // Mock node-7z stream
  let mockStream: any;

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

    // Create a mock zip file
    const zipFilePath = path.join(sourceDir, zipFile);
    await fse.writeFile(zipFilePath, 'Mock zip file content');

    // Mock fs functions to prevent 7zip binary warnings
    const mockFs = fs as jest.Mocked<typeof fs>;
    mockFs.existsSync.mockImplementation((path: any) => {
      // Make the mock 7zip binary appear to exist
      if (path === '/mock/path/to/7za') {
        return true;
      }
      // For other paths, use the real implementation
      return jest.requireActual('fs').existsSync(path);
    });

    mockFs.statSync.mockImplementation((path: any) => {
      // For the mock 7zip binary, return stats with executable permissions
      if (path === '/mock/path/to/7za') {
        return {
          mode: parseInt('755', 8) // rwxr-xr-x permissions
        } as any;
      }
      // For other paths, use the real implementation
      return jest.requireActual('fs').statSync(path);
    });

    mockFs.chmodSync.mockImplementation(() => {
      // Mock chmod to do nothing
    });

    // Mock node-7z extractFull
    mockStream = {
      on: jest.fn((event: string, callback: Function) => {
        if (event === 'end') {
          // Simulate successful extraction by calling the callback immediately
          setTimeout(() => callback(), 0);
        }
        return mockStream;
      })
    };

    jest.spyOn(require('node-7z'), 'extractFull').mockReturnValue(mockStream);
  });

  afterEach(async () => {
    // Restore all mocks
    jest.restoreAllMocks();
  });

  /**
   * Test unpacking a zip file
   */
  it('should unpack a zip file to the target directory', async () => {
    // Arrange
    const source = new FileItem(sourceDir, zipFile, 'zip');
    const target = new FileItem(targetDir, '', '');
    const filePara = new FilePara(source, target, 0, 0, 'unpack');

    // Act
    const result = await unpack(filePara);

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2); // unpack returns an array with 2 DirEvent objects

    // Check if extractFull was called with the correct parameters
    expect(require('node-7z').extractFull).toHaveBeenCalledWith(
      path.join(sourceDir, zipFile),
      path.join(targetDir, ''),
      {$bin: '/mock/path/to/7za'}
    );

    // Check if the stream's on method was called for 'end' and 'error' events
    expect(mockStream.on).toHaveBeenCalledWith('end', expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  /**
   * Test unpacking a zip file to a specific subdirectory
   */
  it('should unpack a zip file to a specific subdirectory', async () => {
    // Arrange
    const subdir = 'extracted';
    const source = new FileItem(sourceDir, zipFile, 'zip');
    const target = new FileItem(targetDir, subdir, '');
    const filePara = new FilePara(source, target, 0, 0, 'unpack');

    // Act
    const result = await unpack(filePara);

    // Assert
    expect(result).toBeDefined();

    // Check if extractFull was called with the correct target directory
    expect(require('node-7z').extractFull).toHaveBeenCalledWith(
      path.join(sourceDir, zipFile),
      path.join(targetDir, subdir),
      {$bin: '/mock/path/to/7za'}
    );
  });



});
