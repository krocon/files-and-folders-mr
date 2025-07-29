import {fileItem2Path} from './file-item-to-path';
import {FileItemIf} from "@fnf-data";

describe('fileItem2Path', () => {

  // Test normal cases with valid inputs
  it('should convert FileItem to path with directory and filename', () => {
    const fileItem: FileItemIf = {
      dir: '/home/user/documents',
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/home/user/documents/file.txt');
  });

  it('should handle Windows-style paths', () => {
    const fileItem: FileItemIf = {
      dir: 'C:\\Users\\user\\Documents',
      base: 'document.pdf',
      ext: '.pdf',
      size: 500,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('C:\\Users\\user\\Documents/document.pdf');
  });

  it('should handle directory items', () => {
    const dirItem: FileItemIf = {
      dir: '/home/user',
      base: 'projects',
      ext: '',
      size: 0,
      date: '2023-01-01',
      isDir: true,
      abs: true
    };

    const result = fileItem2Path(dirItem);
    expect(result).toBe('/home/user/projects');
  });

  // Test edge cases
  it('should handle empty directory', () => {
    const fileItem: FileItemIf = {
      dir: '',
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('file.txt');
  });

  it('should handle directory with trailing slash', () => {
    const fileItem: FileItemIf = {
      dir: '/home/user/documents/',
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/home/user/documents/file.txt');
  });

  it('should handle root directory', () => {
    const fileItem: FileItemIf = {
      dir: '/',
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/file.txt');
  });

  it('should handle empty filename', () => {
    const fileItem: FileItemIf = {
      dir: '/home/user/documents',
      base: '',
      ext: '',
      size: 0,
      date: '2023-01-01',
      isDir: true,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/home/user/documents/');
  });

  it('should handle both empty directory and filename', () => {
    const fileItem: FileItemIf = {
      dir: '',
      base: '',
      ext: '',
      size: 0,
      date: '2023-01-01',
      isDir: true,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('');
  });

  // Test null/undefined properties (but valid object)
  it('should handle null directory property', () => {
    const fileItem: FileItemIf = {
      dir: null as any,
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('file.txt');
  });

  it('should handle undefined directory property', () => {
    const fileItem: FileItemIf = {
      dir: undefined as any,
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('file.txt');
  });

  it('should handle null base property', () => {
    const fileItem: FileItemIf = {
      dir: '/home/user/documents',
      base: null as any,
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/home/user/documents/');
  });

  it('should handle undefined base property', () => {
    const fileItem: FileItemIf = {
      dir: '/home/user/documents',
      base: undefined as any,
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/home/user/documents/');
  });

  // Test error cases
  it('should throw error for null fileItem', () => {
    expect(() => fileItem2Path(null as any)).toThrow('FileItem cannot be null or undefined');
  });

  it('should throw error for undefined fileItem', () => {
    expect(() => fileItem2Path(undefined as any)).toThrow('FileItem cannot be null or undefined');
  });

  // Test special characters and edge cases
  it('should handle special characters in paths', () => {
    const fileItem: FileItemIf = {
      dir: '/home/user/my documents & files',
      base: 'file (copy).txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/home/user/my documents & files/file (copy).txt');
  });

  it('should handle unicode characters', () => {
    const fileItem: FileItemIf = {
      dir: '/home/用户/文档',
      base: '测试文件.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('/home/用户/文档/测试文件.txt');
  });

  it('should handle very long paths', () => {
    const longDir = '/very/long/path/that/goes/on/and/on/with/many/nested/directories/to/test/edge/cases';
    const longFilename = 'very_long_filename_with_many_characters_to_test_boundary_conditions.txt';

    const fileItem: FileItemIf = {
      dir: longDir,
      base: longFilename,
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: true
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe(`${longDir}/${longFilename}`);
  });

  // Test relative paths
  it('should handle relative paths', () => {
    const fileItem: FileItemIf = {
      dir: './documents',
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: false
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('./documents/file.txt');
  });

  it('should handle parent directory references', () => {
    const fileItem: FileItemIf = {
      dir: '../documents',
      base: 'file.txt',
      ext: '.txt',
      size: 100,
      date: '2023-01-01',
      isDir: false,
      abs: false
    };

    const result = fileItem2Path(fileItem);
    expect(result).toBe('../documents/file.txt');
  });
});