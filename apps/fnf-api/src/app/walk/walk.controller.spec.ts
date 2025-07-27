import {Test, TestingModule} from '@nestjs/testing';
import {DirController} from './walk.controller';
import {WalkParaData} from '@fnf-data';
import {
  cleanupTestEnvironment,
  restoreTestEnvironment,
  setupTestEnvironment
} from '../file-action/action/common/test-setup-helper';
import * as path from 'path';
import * as fs from 'fs-extra';

describe('DirController', () => {
  let controller: DirController;

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirController],
    }).compile();

    controller = module.get<DirController>(DirController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('walkdirSync', () => {
    it('should count files correctly without double counting', async () => {
      // Arrange
      const testFile = path.join(sourceDir, 'test-file.txt');
      const walkParaData = new WalkParaData();
      walkParaData.files = [testFile];
      walkParaData.filePattern = '**/*';

      // Ensure test file exists
      expect(fs.existsSync(testFile)).toBe(true);
      const expectedSize = fs.statSync(testFile).size;

      // Act
      const result = await controller.walkdirSync(walkParaData);

      // Assert
      expect(result).toBeDefined();
      expect(result.fileCount).toBe(1); // Should count the file only once
      expect(result.sizeSum).toBe(expectedSize); // Should sum the size only once
      expect(result.last).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle multiple files correctly without double counting', async () => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.files = [sourceDir]; // Use the entire demo directory
      walkParaData.filePattern = '**/*';

      // Act
      const result = await controller.walkdirSync(walkParaData);

      // Assert
      expect(result).toBeDefined();
      expect(result.fileCount).toBeGreaterThan(0);
      expect(result.sizeSum).toBeGreaterThan(0);
      expect(result.last).toBe(true);

      // Verify that the counts are reasonable (not doubled)
      // The demo directory should have a few files, but not an unreasonable number
      expect(result.fileCount).toBeLessThan(20); // Reasonable upper bound
      expect(result.sizeSum).toBeLessThan(10000); // Reasonable size upper bound
    });

    it('should handle single file with specific size correctly', async () => {
      // Arrange - Create a test file with known content
      const testFile = path.join(testDir, 'single-test-file.txt');
      const testContent = 'This is a test file with known content.';
      fs.writeFileSync(testFile, testContent);

      const walkParaData = new WalkParaData();
      walkParaData.files = [testFile];
      walkParaData.filePattern = '**/*';

      try {
        // Act
        const result = await controller.walkdirSync(walkParaData);

        // Assert
        expect(result.fileCount).toBe(1);
        expect(result.sizeSum).toBe(testContent.length);
        expect(result.folderCount).toBe(0);
        expect(result.last).toBe(true);
      } finally {
        // Clean up
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it('should handle empty file list', async () => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.files = [];
      walkParaData.filePattern = '**/*';

      // Act
      const result = await controller.walkdirSync(walkParaData);

      // Assert
      expect(result.fileCount).toBe(0);
      expect(result.folderCount).toBe(0);
      expect(result.sizeSum).toBe(0);
      expect(result.last).toBe(true);
    });

    it('should handle non-existent files gracefully', async () => {
      // Arrange
      const walkParaData = new WalkParaData();
      walkParaData.files = ['/non/existent/file.txt'];
      walkParaData.filePattern = '**/*';

      // Act
      const result = await controller.walkdirSync(walkParaData);

      // Assert
      expect(result.fileCount).toBe(0);
      expect(result.folderCount).toBe(0);
      expect(result.sizeSum).toBe(0);
      expect(result.last).toBe(true);
    });
  });
});