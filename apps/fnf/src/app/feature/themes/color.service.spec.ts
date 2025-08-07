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

  describe('invertCssColor', () => {
    describe('should invert hex colors correctly', () => {
      it('should invert 3-digit hex colors', () => {
        expect(service.invertCssColor('#fff')).toBe('#000');
        expect(service.invertCssColor('#000')).toBe('#fff');
        expect(service.invertCssColor('#f00')).toBe('#0ff');
        expect(service.invertCssColor('#0f0')).toBe('#f0f');
        expect(service.invertCssColor('#00f')).toBe('#ff0');
      });

      it('should invert 6-digit hex colors', () => {
        expect(service.invertCssColor('#ffffff')).toBe('#000000');
        expect(service.invertCssColor('#000000')).toBe('#ffffff');
        expect(service.invertCssColor('#ff0000')).toBe('#00ffff');
        expect(service.invertCssColor('#00ff00')).toBe('#ff00ff');
        expect(service.invertCssColor('#0000ff')).toBe('#ffff00');
        expect(service.invertCssColor('#123456')).toBe('#edcba9');
      });

      it('should invert 8-digit hex colors with alpha', () => {
        expect(service.invertCssColor('#ffffff80')).toBe('#00000080');
        expect(service.invertCssColor('#000000ff')).toBe('#ffffffff');
        expect(service.invertCssColor('#ff000080')).toBe('#00ffff80');
      });

      it('should handle mixed case hex colors', () => {
        expect(service.invertCssColor('#AbCdEf')).toBe('#543210');
        expect(service.invertCssColor('#FFFFFF')).toBe('#000000');
      });
    });

    describe('should invert RGB/RGBA colors correctly', () => {
      it('should invert rgb() format', () => {
        expect(service.invertCssColor('rgb(255, 255, 255)')).toBe('rgb(0, 0, 0)');
        expect(service.invertCssColor('rgb(0, 0, 0)')).toBe('rgb(255, 255, 255)');
        expect(service.invertCssColor('rgb(255, 0, 0)')).toBe('rgb(0, 255, 255)');
        expect(service.invertCssColor('rgb(123, 45, 67)')).toBe('rgb(132, 210, 188)');
      });

      it('should invert rgba() format', () => {
        expect(service.invertCssColor('rgba(255, 255, 255, 1)')).toBe('rgba(0, 0, 0, 1)');
        expect(service.invertCssColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(255, 255, 255, 0.5)');
        expect(service.invertCssColor('rgba(123, 45, 67, 0.8)')).toBe('rgba(132, 210, 188, 0.8)');
      });

      it('should handle whitespace in rgb/rgba', () => {
        expect(service.invertCssColor('rgb( 255 , 0 , 0 )')).toBe('rgb(0, 255, 255)');
        expect(service.invertCssColor('rgba( 100 , 150 , 200 , 0.7 )')).toBe('rgba(155, 105, 55, 0.7)');
      });
    });

    describe('should invert HSL/HSLA colors correctly', () => {
      it('should invert hsl() format', () => {
        expect(service.invertCssColor('hsl(0, 100%, 50%)')).toBe('hsl(180, 100%, 50%)');
        expect(service.invertCssColor('hsl(180, 100%, 50%)')).toBe('hsl(0, 100%, 50%)');
        expect(service.invertCssColor('hsl(120, 50%, 25%)')).toBe('hsl(300, 50%, 75%)');
        expect(service.invertCssColor('hsl(240, 75%, 75%)')).toBe('hsl(60, 75%, 25%)');
      });

      it('should invert hsla() format', () => {
        expect(service.invertCssColor('hsla(0, 100%, 50%, 1)')).toBe('hsla(180, 100%, 50%, 1)');
        expect(service.invertCssColor('hsla(120, 50%, 25%, 0.5)')).toBe('hsla(300, 50%, 75%, 0.5)');
        expect(service.invertCssColor('hsla(240, 75%, 75%, 0.8)')).toBe('hsla(60, 75%, 25%, 0.8)');
      });

      it('should handle hue wraparound correctly', () => {
        expect(service.invertCssColor('hsl(350, 50%, 50%)')).toBe('hsl(170, 50%, 50%)');
        expect(service.invertCssColor('hsl(10, 50%, 50%)')).toBe('hsl(190, 50%, 50%)');
      });
    });

    describe('should invert named colors correctly', () => {
      it('should invert basic named colors', () => {
        expect(service.invertCssColor('black')).toBe('#ffffff');
        expect(service.invertCssColor('white')).toBe('#000000');
        expect(service.invertCssColor('red')).toBe('#00ffff');
        expect(service.invertCssColor('green')).toBe('#ff00ff');
        expect(service.invertCssColor('blue')).toBe('#ffff00');
        expect(service.invertCssColor('yellow')).toBe('#0000ff');
        expect(service.invertCssColor('cyan')).toBe('#ff0000');
        expect(service.invertCssColor('magenta')).toBe('#00ff00');
      });

      it('should handle case insensitive named colors', () => {
        expect(service.invertCssColor('BLACK')).toBe('#ffffff');
        expect(service.invertCssColor('White')).toBe('#000000');
        expect(service.invertCssColor('RED')).toBe('#00ffff');
      });

      it('should handle whitespace around named colors', () => {
        expect(service.invertCssColor(' black ')).toBe('#ffffff');
        expect(service.invertCssColor('  white  ')).toBe('#000000');
      });

      it('should return original color for unmapped named colors', () => {
        expect(service.invertCssColor('aliceblue')).toBe('aliceblue');
        expect(service.invertCssColor('antiquewhite')).toBe('antiquewhite');
      });
    });

    describe('should handle CSS keywords correctly', () => {
      it('should not invert CSS keywords', () => {
        expect(service.invertCssColor('transparent')).toBe('transparent');
        expect(service.invertCssColor('inherit')).toBe('inherit');
        expect(service.invertCssColor('initial')).toBe('initial');
        expect(service.invertCssColor('unset')).toBe('unset');
      });

      it('should handle case insensitive CSS keywords', () => {
        expect(service.invertCssColor('TRANSPARENT')).toBe('TRANSPARENT');
        expect(service.invertCssColor('Inherit')).toBe('Inherit');
      });
    });

    describe('should handle invalid inputs correctly', () => {
      it('should return original value for invalid colors', () => {
        expect(service.invertCssColor('invalid-color')).toBe('invalid-color');
        expect(service.invertCssColor('not-a-color')).toBe('not-a-color');
        expect(service.invertCssColor('123')).toBe('123');
        expect(service.invertCssColor('hello world')).toBe('hello world');
      });

      it('should return original value for empty or null inputs', () => {
        expect(service.invertCssColor('')).toBe('');
        expect(service.invertCssColor('   ')).toBe('   ');
      });

      it('should return original value for malformed color functions', () => {
        expect(service.invertCssColor('rgb(')).toBe('rgb(');
        expect(service.invertCssColor('rgba(255, 255)')).toBe('rgba(255, 255)');
        expect(service.invertCssColor('hsl(invalid)')).toBe('hsl(invalid)');
      });

      it('should return original value for CSS variables', () => {
        expect(service.invertCssColor('var(--primary-color)')).toBe('var(--primary-color)');
        expect(service.invertCssColor('var(--background-color)')).toBe('var(--background-color)');
      });
    });

    describe('should handle edge cases', () => {
      it('should handle colors with extra whitespace', () => {
        expect(service.invertCssColor('  #ffffff  ')).toBe('#000000');
        expect(service.invertCssColor('\t#000000\t')).toBe('#ffffff');
      });

      it('should preserve original format for invalid hex lengths', () => {
        expect(service.invertCssColor('#ff')).toBe('#ff');
        expect(service.invertCssColor('#fffffffff')).toBe('#fffffffff');
      });

      it('should preserve original format for invalid input', () => {
        expect(service.invertCssColor('var(--abc-def)')).toBe('var(--abc-def)');
        expect(service.invertCssColor('ghjk')).toBe('ghjk');
      });
    });
  });
});