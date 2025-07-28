import {unpack} from './unpack.fn';
import {FileItem, FilePara} from '@fnf-data';
import * as fse from 'fs-extra';
import * as path from 'path';
import {extractFull} from 'node-7z';
import {cleanupTestEnvironment, restoreTestEnvironment, setupTestEnvironment} from './common/test-setup-helper';

// Mock 7zip-bin
jest.mock('7zip-bin', () => ({
  default: {
    path7za: '/mock/path/to/7za'
  },
  path7za: '/mock/path/to/7za'
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
    expect(result.length).toBe(0); // unpack returns an empty array

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

  /**
   * Test error handling when the archive file doesn't exist
   */
  it('should throw an error when the archive file does not exist', async () => {
    // Arrange
    const nonExistentZip = 'non-existent.zip';
    const source = new FileItem(sourceDir, nonExistentZip, 'zip');
    const target = new FileItem(targetDir, '', '');
    const filePara = new FilePara(source, target, 0, 0, 'unpack');

    // Mock extractFull to throw an error
    jest.spyOn(require('node-7z'), 'extractFull').mockImplementation(() => {
      throw new Error('File not found');
    });

    // Act & Assert
    await expect(unpack(filePara)).rejects.toThrow('File not found');
  });

  /**
   * Test error handling when extraction fails
   */
  it('should throw an error when extraction fails', async () => {
    // Arrange
    const source = new FileItem(sourceDir, zipFile, 'zip');
    const target = new FileItem(targetDir, '', '');
    const filePara = new FilePara(source, target, 0, 0, 'unpack');

    // Mock stream to emit error event
    const errorStream = {
      on: jest.fn((event: string, callback: Function) => {
        if (event === 'error') {
          // Simulate extraction error by calling the error callback
          setTimeout(() => callback(new Error('Extract failed')), 0);
        }
        return errorStream;
      })
    };

    jest.spyOn(require('node-7z'), 'extractFull').mockReturnValue(errorStream);

    // Act & Assert
    await expect(unpack(filePara)).rejects.toThrow('Extract failed');
  });

  /**
   * Test error handling when parameters are invalid
   */
  it('should throw an error when parameters are invalid', async () => {
    // Act & Assert
    await expect(unpack(null)).rejects.toThrow('Invalid argument exception!');
    await expect(unpack({} as FilePara)).rejects.toThrow('Invalid argument exception!');
    await expect(unpack({source: {}} as FilePara)).rejects.toThrow('Invalid argument exception!');
  });
});
