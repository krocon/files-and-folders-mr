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

  describe('brighter', () => {
    describe('should make colors brighter correctly', () => {
      it('should brighten hex colors', () => {
        expect(service.brighter('#000000', 50)).toBe('#808080');
        expect(service.brighter('#808080', 25)).toBe('#a0a0a0');
        expect(service.brighter('#ff0000', 20)).toBe('#ff3333');
      });

      it('should brighten rgb colors', () => {
        expect(service.brighter('rgb(0, 0, 0)', 50)).toBe('rgb(128, 128, 128)');
        expect(service.brighter('rgb(128, 128, 128)', 25)).toBe('rgb(160, 160, 160)');
      });

      it('should brighten rgba colors', () => {
        expect(service.brighter('rgba(0, 0, 0, 0.5)', 50)).toBe('rgba(128, 128, 128, 0.5)');
        expect(service.brighter('rgba(100, 100, 100, 0.8)', 20)).toBe('rgba(131, 131, 131, 0.8)');
      });

      it('should brighten hsl colors', () => {
        expect(service.brighter('hsl(0, 100%, 25%)', 25)).toBe('hsl(0, 43%, 44%)');
        expect(service.brighter('hsl(120, 50%, 30%)', 20)).toBe('hsl(120, 28%, 44%)');
      });

      it('should brighten hsla colors', () => {
        expect(service.brighter('hsla(0, 100%, 25%, 0.7)', 25)).toBe('hsla(0, 43%, 44%, 0.7)');
        expect(service.brighter('hsla(240, 75%, 40%, 1)', 10)).toBe('hsla(240, 59%, 46%, 1)');
      });

      it('should brighten named colors', () => {
        expect(service.brighter('black', 50)).toBe('rgb(128, 128, 128)');
        expect(service.brighter('red', 25)).toBe('rgb(255, 64, 64)');
        expect(service.brighter('blue', 20)).toBe('rgb(51, 51, 255)');
      });
    });

    describe('should handle edge cases', () => {
      it('should return original color for val = 0', () => {
        expect(service.brighter('#ff0000', 0)).toBe('#ff0000');
        expect(service.brighter('rgb(100, 100, 100)', 0)).toBe('rgb(100, 100, 100)');
      });

      it('should cap at maximum brightness', () => {
        expect(service.brighter('#ffffff', 50)).toBe('#ffffff');
        expect(service.brighter('hsl(0, 100%, 90%)', 50)).toBe('hsl(0, 100%, 95%)');
      });

      it('should return original color for invalid inputs', () => {
        expect(service.brighter('invalid-color', 50)).toBe('invalid-color');
        expect(service.brighter('#ff0000', -10)).toBe('#ff0000');
        expect(service.brighter('#ff0000', 150)).toBe('#ff0000');
        expect(service.brighter('', 50)).toBe('');
      });

      it('should handle whitespace', () => {
        expect(service.brighter('  #000000  ', 50)).toBe('#808080');
        expect(service.brighter(' rgb(0, 0, 0) ', 50)).toBe('rgb(128, 128, 128)');
      });
    });
  });

  describe('darker', () => {
    describe('should make colors darker correctly', () => {
      it('should darken hex colors', () => {
        expect(service.darker('#ffffff', 50)).toBe('#808080');
        expect(service.darker('#808080', 25)).toBe('#606060');
        expect(service.darker('#ff0000', 20)).toBe('#cc0000');
      });

      it('should darken rgb colors', () => {
        expect(service.darker('rgb(255, 255, 255)', 50)).toBe('rgb(128, 128, 128)');
        expect(service.darker('rgb(128, 128, 128)', 25)).toBe('rgb(96, 96, 96)');
      });

      it('should darken rgba colors', () => {
        expect(service.darker('rgba(255, 255, 255, 0.5)', 50)).toBe('rgba(128, 128, 128, 0.5)');
        expect(service.darker('rgba(200, 200, 200, 0.8)', 20)).toBe('rgba(160, 160, 160, 0.8)');
      });

      it('should darken hsl colors', () => {
        expect(service.darker('hsl(0, 100%, 75%)', 25)).toBe('hsl(0, 43%, 56%)');
        expect(service.darker('hsl(120, 50%, 70%)', 20)).toBe('hsl(120, 28%, 56%)');
      });

      it('should darken hsla colors', () => {
        expect(service.darker('hsla(0, 100%, 75%, 0.7)', 25)).toBe('hsla(0, 43%, 56%, 0.7)');
        expect(service.darker('hsla(240, 75%, 60%, 1)', 10)).toBe('hsla(240, 59%, 54%, 1)');
      });

      it('should darken named colors', () => {
        expect(service.darker('white', 50)).toBe('rgb(128, 128, 128)');
        expect(service.darker('red', 25)).toBe('rgb(191, 0, 0)');
        expect(service.darker('blue', 20)).toBe('rgb(0, 0, 204)');
      });
    });

    describe('should handle edge cases', () => {
      it('should return original color for val = 0', () => {
        expect(service.darker('#ff0000', 0)).toBe('#ff0000');
        expect(service.darker('rgb(100, 100, 100)', 0)).toBe('rgb(100, 100, 100)');
      });

      it('should cap at minimum darkness', () => {
        expect(service.darker('#000000', 50)).toBe('#000000');
        expect(service.darker('hsl(0, 100%, 10%)', 50)).toBe('hsl(0, 100%, 5%)');
      });

      it('should return original color for invalid inputs', () => {
        expect(service.darker('invalid-color', 50)).toBe('invalid-color');
        expect(service.darker('#ff0000', -10)).toBe('#ff0000');
        expect(service.darker('#ff0000', 150)).toBe('#ff0000');
        expect(service.darker('', 50)).toBe('');
      });

      it('should handle whitespace', () => {
        expect(service.darker('  #ffffff  ', 50)).toBe('#808080');
        expect(service.darker(' rgb(255, 255, 255) ', 50)).toBe('rgb(128, 128, 128)');
      });
    });
  });

  describe('transparent', () => {
    describe('should make colors more transparent correctly', () => {
      it('should add transparency to hex colors', () => {
        expect(service.transparent('#ff0000', 50)).toBe('#ff000080');
        expect(service.transparent('#000000', 25)).toBe('#000000bf');
        expect(service.transparent('#ffffff', 75)).toBe('#ffffff40');
      });

      it('should adjust transparency in rgb colors', () => {
        expect(service.transparent('rgb(255, 0, 0)', 50)).toBe('rgba(255, 0, 0, 0.5)');
        expect(service.transparent('rgb(0, 0, 0)', 25)).toBe('rgba(0, 0, 0, 0.75)');
        expect(service.transparent('rgb(255, 255, 255)', 75)).toBe('rgba(255, 255, 255, 0.25)');
      });

      it('should adjust transparency in rgba colors', () => {
        expect(service.transparent('rgba(255, 0, 0, 1)', 50)).toBe('rgba(255, 0, 0, 0.5)');
        expect(service.transparent('rgba(0, 0, 0, 0.8)', 25)).toBe('rgba(0, 0, 0, 0.6)');
        expect(service.transparent('rgba(255, 255, 255, 0.6)', 50)).toBe('rgba(255, 255, 255, 0.3)');
      });

      it('should adjust transparency in hsl colors', () => {
        expect(service.transparent('hsl(0, 100%, 50%)', 50)).toBe('hsla(0, 100%, 50%, 0.5)');
        expect(service.transparent('hsl(120, 50%, 25%)', 25)).toBe('hsla(120, 50%, 25%, 0.75)');
      });

      it('should adjust transparency in hsla colors', () => {
        expect(service.transparent('hsla(0, 100%, 50%, 1)', 50)).toBe('hsla(0, 100%, 50%, 0.5)');
        expect(service.transparent('hsla(240, 75%, 40%, 0.8)', 25)).toBe('hsla(240, 75%, 40%, 0.6)');
      });

      it('should adjust transparency in named colors', () => {
        expect(service.transparent('red', 50)).toBe('rgba(255, 0, 0, 0.5)');
        expect(service.transparent('blue', 25)).toBe('rgba(0, 0, 255, 0.75)');
        expect(service.transparent('white', 75)).toBe('rgba(255, 255, 255, 0.25)');
      });
    });

    describe('should handle edge cases', () => {
      it('should return original color for val = 0', () => {
        expect(service.transparent('#ff0000', 0)).toBe('#ff0000');
        expect(service.transparent('rgb(100, 100, 100)', 0)).toBe('rgb(100, 100, 100)');
        expect(service.transparent('rgba(100, 100, 100, 0.5)', 0)).toBe('rgba(100, 100, 100, 0.5)');
      });

      it('should cap at full transparency', () => {
        expect(service.transparent('#ff0000', 100)).toBe('#ff000000');
        expect(service.transparent('rgba(255, 0, 0, 0.5)', 100)).toBe('rgba(255, 0, 0, 0)');
      });

      it('should return original color for invalid inputs', () => {
        expect(service.transparent('invalid-color', 50)).toBe('invalid-color');
        expect(service.transparent('#ff0000', -10)).toBe('#ff0000');
        expect(service.transparent('#ff0000', 150)).toBe('#ff0000');
        expect(service.transparent('', 50)).toBe('');
      });

      it('should handle whitespace', () => {
        expect(service.transparent('  #ff0000  ', 50)).toBe('#ff000080');
        expect(service.transparent(' rgb(255, 0, 0) ', 50)).toBe('rgba(255, 0, 0, 0.5)');
      });

      it('should handle CSS keywords correctly', () => {
        expect(service.transparent('transparent', 50)).toBe('transparent');
        expect(service.transparent('inherit', 25)).toBe('inherit');
        expect(service.transparent('initial', 75)).toBe('initial');
      });
    });
  });

  describe('mergeColors', () => {
    describe('should merge colors with alpha blending mode (default)', () => {
      it('should merge hex colors with default ratio (0.5)', () => {
        expect(service.mergeColors('#ff0000', '#0000ff')).toBe('#800080');
        expect(service.mergeColors('#ffffff', '#000000')).toBe('#808080');
        expect(service.mergeColors('#ff0000', '#00ff00')).toBe('#808000');
      });

      it('should merge hex colors with custom ratio', () => {
        expect(service.mergeColors('#ff0000', '#0000ff', 0.25)).toBe('#bf0040');
        expect(service.mergeColors('#ff0000', '#0000ff', 0.75)).toBe('#4000bf');
        expect(service.mergeColors('#ffffff', '#000000', 0.1)).toBe('#e6e6e6');
      });

      it('should merge rgb colors', () => {
        expect(service.mergeColors('rgb(255, 0, 0)', 'rgb(0, 0, 255)')).toBe('rgb(128, 0, 128)');
        expect(service.mergeColors('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 0.3)).toBe('rgb(179, 179, 179)');
      });

      it('should merge rgba colors', () => {
        expect(service.mergeColors('rgba(255, 0, 0, 1)', 'rgba(0, 0, 255, 0.5)')).toBe('rgba(128, 0, 128, 0.75)');
        expect(service.mergeColors('rgba(255, 255, 255, 0.8)', 'rgba(0, 0, 0, 0.6)', 0.25)).toBe('rgba(191, 191, 191, 0.75)');
      });

      it('should merge hsl colors', () => {
        expect(service.mergeColors('hsl(0, 100%, 50%)', 'hsl(240, 100%, 50%)')).toBe('hsl(300, 100%, 25%)');
        expect(service.mergeColors('hsl(120, 50%, 50%)', 'hsl(240, 75%, 25%)', 0.3)).toBe('hsl(139, 47%, 37%)');
      });

      it('should merge named colors', () => {
        expect(service.mergeColors('red', 'blue')).toBe('rgb(128, 0, 128)');
        expect(service.mergeColors('white', 'black', 0.2)).toBe('rgb(204, 204, 204)');
      });

      it('should merge mixed color formats', () => {
        expect(service.mergeColors('#ff0000', 'rgb(0, 0, 255)')).toBe('#800080');
        expect(service.mergeColors('red', 'hsl(240, 100%, 50%)')).toBe('rgb(128, 0, 128)');
        expect(service.mergeColors('rgba(255, 0, 0, 0.8)', '#0000ff', 0.25)).toBe('rgba(191, 0, 64, 0.85)');
      });
    });

    describe('should merge colors with additive blending mode', () => {
      it('should add colors together', () => {
        expect(service.mergeColors('#800000', '#008000', 0.5, 'additive')).toBe('#804000');
        expect(service.mergeColors('rgb(100, 100, 100)', 'rgb(50, 50, 50)', 1, 'additive')).toBe('rgb(150, 150, 150)');
      });

      it('should cap at maximum values', () => {
        expect(service.mergeColors('#ffffff', '#ffffff', 0.5, 'additive')).toBe('#ffffff');
        expect(service.mergeColors('rgb(200, 200, 200)', 'rgb(100, 100, 100)', 1, 'additive')).toBe('rgb(255, 255, 255)');
      });
    });

    describe('should merge colors with average blending mode', () => {
      it('should average colors correctly', () => {
        expect(service.mergeColors('#ff0000', '#0000ff', 0.5, 'average')).toBe('#800080');
        expect(service.mergeColors('rgb(100, 100, 100)', 'rgb(200, 200, 200)', 0.3, 'average')).toBe('rgb(130, 130, 130)');
      });
    });

    describe('should handle edge cases', () => {
      it('should return first color for invalid inputs', () => {
        expect(service.mergeColors('invalid-color', '#ff0000')).toBe('invalid-color');
        expect(service.mergeColors('#ff0000', 'invalid-color')).toBe('#ff0000');
        expect(service.mergeColors('', '#ff0000')).toBe('');
      });

      it('should clamp ratio values', () => {
        expect(service.mergeColors('#ff0000', '#0000ff', -0.5)).toBe('#ff0000');
        expect(service.mergeColors('#ff0000', '#0000ff', 1.5)).toBe('#0000ff');
        expect(service.mergeColors('#ff0000', '#0000ff', 0)).toBe('#ff0000');
        expect(service.mergeColors('#ff0000', '#0000ff', 1)).toBe('#0000ff');
      });

      it('should handle whitespace', () => {
        expect(service.mergeColors('  #ff0000  ', '  #0000ff  ')).toBe('#800080');
        expect(service.mergeColors(' rgb(255, 0, 0) ', ' rgb(0, 0, 255) ', 0.25)).toBe('rgb(191, 0, 64)');
      });

      it('should preserve original format', () => {
        expect(service.mergeColors('#ff0000', 'rgb(0, 0, 255)')).toBe('#800080');
        expect(service.mergeColors('rgb(255, 0, 0)', '#0000ff')).toBe('rgb(128, 0, 128)');
        expect(service.mergeColors('hsl(0, 100%, 50%)', 'rgb(0, 0, 255)')).toBe('hsl(300, 100%, 25%)');
      });
    });
  });

  describe('blendColorsAlpha', () => {
    describe('should blend colors using alpha blending', () => {
      it('should blend hex colors', () => {
        expect(service.blendColorsAlpha('#ff0000', '#0000ff', 0.5)).toBe('#800080');
        expect(service.blendColorsAlpha('#ffffff', '#000000', 0.25)).toBe('#bfbfbf');
        expect(service.blendColorsAlpha('#000000', '#ffffff', 0.75)).toBe('#bfbfbf');
      });

      it('should blend rgb colors', () => {
        expect(service.blendColorsAlpha('rgb(255, 0, 0)', 'rgb(0, 0, 255)', 0.5)).toBe('rgb(128, 0, 128)');
        expect(service.blendColorsAlpha('rgb(100, 100, 100)', 'rgb(200, 200, 200)', 0.3)).toBe('rgb(130, 130, 130)');
      });

      it('should blend rgba colors', () => {
        expect(service.blendColorsAlpha('rgba(255, 0, 0, 1)', 'rgba(0, 0, 255, 0.5)', 0.5)).toBe('rgba(128, 0, 128, 0.75)');
        expect(service.blendColorsAlpha('rgba(255, 255, 255, 0.8)', 'rgba(0, 0, 0, 0.6)', 0.25)).toBe('rgba(191, 191, 191, 0.75)');
      });

      it('should blend hsl colors', () => {
        expect(service.blendColorsAlpha('hsl(0, 100%, 50%)', 'hsl(240, 100%, 50%)', 0.5)).toBe('hsl(300, 100%, 25%)');
        expect(service.blendColorsAlpha('hsl(120, 50%, 50%)', 'hsl(240, 75%, 25%)', 0.3)).toBe('hsl(139, 47%, 37%)');
      });

      it('should blend named colors', () => {
        expect(service.blendColorsAlpha('red', 'blue', 0.5)).toBe('rgb(128, 0, 128)');
        expect(service.blendColorsAlpha('white', 'black', 0.2)).toBe('rgb(204, 204, 204)');
      });

      it('should blend mixed color formats', () => {
        expect(service.blendColorsAlpha('#ff0000', 'rgb(0, 0, 255)', 0.5)).toBe('#800080');
        expect(service.blendColorsAlpha('red', 'hsl(240, 100%, 50%)', 0.25)).toBe('rgb(191, 0, 64)');
      });
    });

    describe('should handle edge cases', () => {
      it('should return first color for invalid inputs', () => {
        expect(service.blendColorsAlpha('invalid-color', '#ff0000', 0.5)).toBe('invalid-color');
        expect(service.blendColorsAlpha('#ff0000', 'invalid-color', 0.5)).toBe('#ff0000');
        expect(service.blendColorsAlpha('', '#ff0000', 0.5)).toBe('');
      });

      it('should clamp alpha values', () => {
        expect(service.blendColorsAlpha('#ff0000', '#0000ff', -0.5)).toBe('#ff0000');
        expect(service.blendColorsAlpha('#ff0000', '#0000ff', 1.5)).toBe('#0000ff');
        expect(service.blendColorsAlpha('#ff0000', '#0000ff', 0)).toBe('#ff0000');
        expect(service.blendColorsAlpha('#ff0000', '#0000ff', 1)).toBe('#0000ff');
      });

      it('should handle whitespace', () => {
        expect(service.blendColorsAlpha('  #ff0000  ', '  #0000ff  ', 0.5)).toBe('#800080');
        expect(service.blendColorsAlpha(' rgb(255, 0, 0) ', ' rgb(0, 0, 255) ', 0.25)).toBe('rgb(191, 0, 64)');
      });

      it('should preserve original format', () => {
        expect(service.blendColorsAlpha('#ff0000', 'rgb(0, 0, 255)', 0.5)).toBe('#800080');
        expect(service.blendColorsAlpha('rgb(255, 0, 0)', '#0000ff', 0.5)).toBe('rgb(128, 0, 128)');
        expect(service.blendColorsAlpha('hsl(0, 100%, 50%)', 'rgb(0, 0, 255)', 0.5)).toBe('hsl(300, 100%, 25%)');
      });
    });
  });
});