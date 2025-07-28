import {filepath2FileItem} from './filepath-to-file-items';
import {FileItemIf} from '@fnf-data';

describe('filepath2FileItem', () => {

  it('should parse a basic file path with extension', () => {
    const input = '/Users/abc/Filme/mk.txt';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('/Users/abc/Filme');
    expect(result.base).toBe('mk.txt');
    expect(result.ext).toBe('.txt');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should parse a file path without extension', () => {
    const input = '/home/user/documents/README';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('/home/user/documents');
    expect(result.base).toBe('README');
    expect(result.ext).toBe('');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should parse a file path with multiple dots in filename', () => {
    const input = '/var/log/app.config.json';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('/var/log');
    expect(result.base).toBe('app.config.json');
    expect(result.ext).toBe('.json');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should parse Windows-style path', () => {
    const input = 'C:/Users/John/Documents/file.pdf';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('C:/Users/John/Documents');
    expect(result.base).toBe('file.pdf');
    expect(result.ext).toBe('.pdf');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should handle file in root directory', () => {
    const input = '/file.txt';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('');
    expect(result.base).toBe('file.txt');
    expect(result.ext).toBe('.txt');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should handle filename starting with dot', () => {
    const input = '/home/user/.bashrc';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('/home/user');
    expect(result.base).toBe('.bashrc');
    expect(result.ext).toBe('.bashrc');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should handle filename with extension starting with dot', () => {
    const input = '/home/user/.config.json';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('/home/user');
    expect(result.base).toBe('.config.json');
    expect(result.ext).toBe('.json');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should handle empty filename (edge case)', () => {
    const input = '/home/user/';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('/home/user');
    expect(result.base).toBe('');
    expect(result.ext).toBe('');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should handle single filename without directory', () => {
    const input = 'file.txt';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('');
    expect(result.base).toBe('file.txt');
    expect(result.ext).toBe('.txt');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });

  it('should handle complex nested path', () => {
    const input = '/Users/developer/projects/my-app/src/components/Button.tsx';
    const result: FileItemIf = filepath2FileItem(input);

    expect(result.dir).toBe('/Users/developer/projects/my-app/src/components');
    expect(result.base).toBe('Button.tsx');
    expect(result.ext).toBe('.tsx');
    expect(result.size).toBe(0);
    expect(result.date).toBe('');
    expect(result.isDir).toBe(false);
    expect(result.abs).toBe(false);
  });
});