import {TestBed} from '@angular/core/testing';
import {ColorService} from './color.service';

describe('ColorService', () => {
  let service: ColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isColorValue', () => {
    describe('should return true for valid hex colors', () => {
      it('should accept 3-digit hex colors', () => {
        expect(service.isColorValue('#fff')).toBe(true);
        expect(service.isColorValue('#000')).toBe(true);
        expect(service.isColorValue('#abc')).toBe(true);
      });

      it('should accept 6-digit hex colors', () => {
        expect(service.isColorValue('#ffffff')).toBe(true);
        expect(service.isColorValue('#000000')).toBe(true);
        expect(service.isColorValue('#abcdef')).toBe(true);
        expect(service.isColorValue('#123456')).toBe(true);
      });

      it('should accept 8-digit hex colors with alpha', () => {
        expect(service.isColorValue('#ffffffff')).toBe(true);
        expect(service.isColorValue('#00000000')).toBe(true);
        expect(service.isColorValue('#abcdef12')).toBe(true);
      });
    });

    describe('should return true for valid RGB/RGBA colors', () => {
      it('should accept rgb() format', () => {
        expect(service.isColorValue('rgb(255, 255, 255)')).toBe(true);
        expect(service.isColorValue('rgb(0, 0, 0)')).toBe(true);
        expect(service.isColorValue('rgb(123, 45, 67)')).toBe(true);
      });

      it('should accept rgba() format', () => {
        expect(service.isColorValue('rgba(255, 255, 255, 1)')).toBe(true);
        expect(service.isColorValue('rgba(0, 0, 0, 0.5)')).toBe(true);
        expect(service.isColorValue('rgba(123, 45, 67, 0.8)')).toBe(true);
      });
    });

    describe('should return true for valid HSL/HSLA colors', () => {
      it('should accept hsl() format', () => {
        expect(service.isColorValue('hsl(0, 100%, 50%)')).toBe(true);
        expect(service.isColorValue('hsl(120, 50%, 25%)')).toBe(true);
        expect(service.isColorValue('hsl(240, 75%, 75%)')).toBe(true);
      });

      it('should accept hsla() format', () => {
        expect(service.isColorValue('hsla(0, 100%, 50%, 1)')).toBe(true);
        expect(service.isColorValue('hsla(120, 50%, 25%, 0.5)')).toBe(true);
        expect(service.isColorValue('hsla(240, 75%, 75%, 0.8)')).toBe(true);
      });
    });

    describe('should return true for named colors', () => {
      it('should accept basic named colors', () => {
        expect(service.isColorValue('red')).toBe(true);
        expect(service.isColorValue('green')).toBe(true);
        expect(service.isColorValue('blue')).toBe(true);
        expect(service.isColorValue('yellow')).toBe(true);
        expect(service.isColorValue('orange')).toBe(true);
        expect(service.isColorValue('purple')).toBe(true);
        expect(service.isColorValue('pink')).toBe(true);
        expect(service.isColorValue('brown')).toBe(true);
        expect(service.isColorValue('black')).toBe(true);
        expect(service.isColorValue('white')).toBe(true);
        expect(service.isColorValue('gray')).toBe(true);
        expect(service.isColorValue('grey')).toBe(true);
      });

      it('should be case insensitive for named colors', () => {
        expect(service.isColorValue('RED')).toBe(true);
        expect(service.isColorValue('Green')).toBe(true);
        expect(service.isColorValue('BLUE')).toBe(true);
        expect(service.isColorValue('White')).toBe(true);
      });

      it('should handle whitespace around named colors', () => {
        expect(service.isColorValue(' red ')).toBe(true);
        expect(service.isColorValue('  blue  ')).toBe(true);
        expect(service.isColorValue('\tgreen\t')).toBe(true);
      });
    });

    describe('should return true for CSS keywords', () => {
      it('should accept transparent', () => {
        expect(service.isColorValue('transparent')).toBe(true);
      });

      it('should accept inherit', () => {
        expect(service.isColorValue('inherit')).toBe(true);
      });

      it('should accept initial', () => {
        expect(service.isColorValue('initial')).toBe(true);
      });

      it('should accept unset', () => {
        expect(service.isColorValue('unset')).toBe(true);
      });
    });

    describe('should return false for CSS variables', () => {
      it('should reject var() functions', () => {
        expect(service.isColorValue('var(--primary-color)')).toBe(false);
        expect(service.isColorValue('var(--background-color)')).toBe(false);
        expect(service.isColorValue('var(--text-color, #000)')).toBe(false);
      });
    });

    describe('should return false for invalid values', () => {
      it('should reject invalid hex colors', () => {
        expect(service.isColorValue('#')).toBe(false);
        expect(service.isColorValue('#ff')).toBe(false);
        expect(service.isColorValue('#gggggg')).toBe(false);
        expect(service.isColorValue('ff0000')).toBe(false); // missing #
      });

      it('should reject invalid named colors', () => {
        expect(service.isColorValue('invalidcolor')).toBe(false);
        expect(service.isColorValue('notacolor')).toBe(false);
        expect(service.isColorValue('rainbow')).toBe(false);
      });

      it('should reject empty or whitespace-only strings', () => {
        expect(service.isColorValue('')).toBe(false);
        expect(service.isColorValue(' ')).toBe(false);
        expect(service.isColorValue('\t')).toBe(false);
        expect(service.isColorValue('\n')).toBe(false);
      });

      it('should reject random text', () => {
        expect(service.isColorValue('hello world')).toBe(false);
        expect(service.isColorValue('123')).toBe(false);
        expect(service.isColorValue('abc')).toBe(false);
        expect(service.isColorValue('font-size')).toBe(false);
      });

      it('should reject incomplete color functions', () => {
        expect(service.isColorValue('rgb(')).toBe(false);
        expect(service.isColorValue('rgba(')).toBe(false);
        expect(service.isColorValue('hsl(')).toBe(false);
        expect(service.isColorValue('hsla(')).toBe(false);
      });
    });

    describe('should handle edge cases', () => {
      it('should handle mixed case hex colors', () => {
        expect(service.isColorValue('#AbCdEf')).toBe(true);
        expect(service.isColorValue('#FFFFFF')).toBe(true);
        expect(service.isColorValue('#ffffff')).toBe(true);
      });

      it('should handle whitespace around valid colors', () => {
        expect(service.isColorValue(' #ffffff ')).toBe(true);
        expect(service.isColorValue('  rgb(255, 255, 255)  ')).toBe(true);
        expect(service.isColorValue('\t#000\t')).toBe(true);
      });
    });
  });
});