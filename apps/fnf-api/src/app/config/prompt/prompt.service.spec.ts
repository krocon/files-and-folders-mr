import {Test, TestingModule} from '@nestjs/testing';
import {PromptService} from './prompt.service';
import {promises as fs} from 'fs';
import * as yaml from 'js-yaml';
import {PromptDataIf} from '@fnf-data';

// Mock fs and yaml modules
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    copyFile: jest.fn(),
    unlink: jest.fn(),
  },
  existsSync: jest.fn(),
}));

jest.mock('js-yaml', () => ({
  load: jest.fn(),
  dump: jest.fn(),
}));

// Mock environment
jest.mock('../../../environments/environment', () => ({
  environment: {
    promptDefaultsPath: '/mock/defaults',
    promptCustomPath: '/mock/custom',
  },
}));

describe('PromptService', () => {
  let service: PromptService;
  let mockFs: jest.Mocked<typeof fs>;
  let mockYaml: jest.Mocked<typeof yaml>;

  const mockPromptData: PromptDataIf = {
    description: 'Test prompt description',
    prompt: 'Test prompt content',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptService],
    }).compile();

    service = module.get<PromptService>(PromptService);
    mockFs = fs as jest.Mocked<typeof fs>;
    mockYaml = yaml as jest.Mocked<typeof yaml>;

    // Mock logger methods to suppress console output during tests
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {
    });
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {
    });
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {
    });
    jest.spyOn(service['logger'], 'debug').mockImplementation(() => {
    });
    jest.spyOn(service['logger'], 'verbose').mockImplementation(() => {
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDefaultNames', () => {
    it('should return sorted default prompt names without .yaml extension', async () => {
      mockFs.readdir.mockResolvedValue(['convert_filenames.yaml', 'group_filenames.yaml'] as any);

      const result = await service.getDefaultNames();

      expect(result).toEqual(['convert_filenames', 'group_filenames']);
      expect(mockFs.readdir).toHaveBeenCalledWith('/mock/defaults');
    });

    it('should throw error when readdir fails', async () => {
      const error = new Error('Directory not found');
      mockFs.readdir.mockRejectedValue(error);

      await expect(service.getDefaultNames()).rejects.toThrow('Directory not found');
    });
  });

  describe('getCustomNames', () => {
    it('should return sorted custom prompt names without .yaml extension', async () => {
      mockFs.readdir.mockResolvedValue(['custom_prompt.yaml', 'another_prompt.yaml'] as any);

      const result = await service.getCustomNames();

      expect(result).toEqual(['another_prompt', 'custom_prompt']);
      expect(mockFs.readdir).toHaveBeenCalledWith('/mock/custom');
    });

    it('should throw error when readdir fails', async () => {
      const error = new Error('Directory not found');
      mockFs.readdir.mockRejectedValue(error);

      await expect(service.getCustomNames()).rejects.toThrow('Directory not found');
    });
  });

  describe('getPrompt', () => {
    it('should return custom prompt when it exists', async () => {
      mockFs.readFile.mockResolvedValueOnce('custom yaml content' as any);
      mockYaml.load.mockReturnValueOnce(mockPromptData);

      const result = await service.getPrompt('test_key');

      expect(result).toEqual(mockPromptData);
      expect(mockFs.readFile).toHaveBeenCalledWith('/mock/custom/test_key.yaml', 'utf-8');
      expect(mockYaml.load).toHaveBeenCalledWith('custom yaml content');
    });

    it('should return default prompt when custom does not exist', async () => {
      // First call (custom) fails with ENOENT
      const enoentError = new Error('File not found') as any;
      enoentError.code = 'ENOENT';
      mockFs.readFile.mockRejectedValueOnce(enoentError);

      // Second call (defaults) succeeds
      mockFs.readFile.mockResolvedValueOnce('default yaml content' as any);
      mockYaml.load.mockReturnValueOnce(mockPromptData);

      const result = await service.getPrompt('test_key');

      expect(result).toEqual(mockPromptData);
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
      expect(mockFs.readFile).toHaveBeenNthCalledWith(1, '/mock/custom/test_key.yaml', 'utf-8');
      expect(mockFs.readFile).toHaveBeenNthCalledWith(2, '/mock/defaults/test_key.yaml', 'utf-8');
    });

    it('should return null when both custom and default fail', async () => {
      const error = new Error('File not found');
      mockFs.readFile.mockRejectedValue(error);

      const result = await service.getPrompt('test_key');
      expect(result).toBeNull();
    });
  });

  describe('savePrompt', () => {
    it('should save prompt to custom path', async () => {
      const existsSync = require('fs').existsSync;
      existsSync.mockReturnValue(true);
      mockYaml.dump.mockReturnValue('dumped yaml content');

      await service.savePrompt('test_key', mockPromptData);

      expect(mockYaml.dump).toHaveBeenCalledWith(mockPromptData);
      expect(mockFs.writeFile).toHaveBeenCalledWith('/mock/custom/test_key.yaml', 'dumped yaml content');
    });

    it('should copy from defaults if custom file does not exist', async () => {
      const existsSync = require('fs').existsSync;
      existsSync.mockReturnValue(false);
      mockYaml.dump.mockReturnValue('dumped yaml content');

      await service.savePrompt('test_key', mockPromptData);

      expect(mockFs.copyFile).toHaveBeenCalledWith('/mock/defaults/test_key.yaml', '/mock/custom/test_key.yaml');
      expect(mockFs.writeFile).toHaveBeenCalledWith('/mock/custom/test_key.yaml', 'dumped yaml content');
    });

    it('should throw error when writeFile fails', async () => {
      const existsSync = require('fs').existsSync;
      existsSync.mockReturnValue(true);
      const error = new Error('Write failed');
      mockFs.writeFile.mockRejectedValue(error);

      await expect(service.savePrompt('test_key', mockPromptData)).rejects.toThrow('Write failed');
    });
  });

  describe('resetToDefaults', () => {
    it('should remove custom file and return defaults', async () => {
      mockFs.readFile.mockResolvedValue('default yaml content' as any);
      mockYaml.load.mockReturnValue(mockPromptData);

      const result = await service.resetToDefaults('test_key');

      expect(mockFs.unlink).toHaveBeenCalledWith('/mock/custom/test_key.yaml');
      expect(result).toEqual(mockPromptData);
    });

    it('should handle ENOENT error when custom file does not exist', async () => {
      const enoentError = new Error('File not found') as any;
      enoentError.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(enoentError);
      mockFs.readFile.mockResolvedValue('default yaml content' as any);
      mockYaml.load.mockReturnValue(mockPromptData);

      const result = await service.resetToDefaults('test_key');

      expect(result).toEqual(mockPromptData);
    });

    it('should throw error when unlink fails with non-ENOENT error', async () => {
      const error = new Error('Permission denied') as any;
      error.code = 'EPERM';
      mockFs.unlink.mockRejectedValue(error);

      await expect(service.resetToDefaults('test_key')).rejects.toThrow('Permission denied');
    });
  });

  describe('getDefaults', () => {
    it('should return default prompt data', async () => {
      mockFs.readFile.mockResolvedValue('default yaml content' as any);
      mockYaml.load.mockReturnValue(mockPromptData);

      const result = await service.getDefaults('test_key');

      expect(result).toEqual(mockPromptData);
      expect(mockFs.readFile).toHaveBeenCalledWith('/mock/defaults/test_key.yaml', 'utf-8');
    });

    it('should return null when default file does not exist', async () => {
      const error = new Error('File not found');
      mockFs.readFile.mockRejectedValue(error);

      const result = await service.getDefaults('test_key');

      expect(result).toBeNull();
    });
  });
});