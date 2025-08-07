import {Injectable} from '@angular/core';
import {ColorDataIf} from "@fnf-data";

@Injectable({
  providedIn: 'root'
})
export class ColorService {


  /**
   * Extracts all real color values from a theme's color data, filtering out CSS variables and invalid color values.
   * This method iterates through all color properties in the theme and returns only the actual color values
   * (hex, rgb, rgba, hsl, hsla, named colors) while excluding CSS custom properties like var(--color-name).
   *
   * @param cd - The color data interface containing the theme's color definitions
   * @returns An array of unique color strings found in the theme, or an empty array if no valid colors are found
   *
   * @example
   * // Basic usage with hex colors
   * const themeData: ColorDataIf = {
   *   colors: {
   *     primary: '#3498db',
   *     secondary: '#e74c3c',
   *     background: '#ffffff'
   *   }
   * };
   * const colors = colorService.getRealColorsFromTheme(themeData);
   * // Returns: ['#3498db', '#e74c3c', '#ffffff']
   *
   * @example
   * // Mixed color formats with CSS variables (variables are filtered out)
   * const themeData: ColorDataIf = {
   *   colors: {
   *     primary: '#3498db',
   *     secondary: 'rgb(231, 76, 60)',
   *     accent: 'hsl(120, 100%, 50%)',
   *     text: 'var(--text-color)',  // This will be filtered out
   *     background: 'white'
   *   }
   * };
   * const colors = colorService.getRealColorsFromTheme(themeData);
   * // Returns: ['#3498db', 'rgb(231, 76, 60)', 'hsl(120, 100%, 50%)', 'white']
   *
   * @example
   * // Empty or undefined colors object
   * const emptyTheme: ColorDataIf = { colors: {} };
   * const colors1 = colorService.getRealColorsFromTheme(emptyTheme);
   * // Returns: []
   *
   * const undefinedTheme: ColorDataIf = {};
   * const colors2 = colorService.getRealColorsFromTheme(undefinedTheme);
   * // Returns: []
   *
   * @example
   * // Duplicate colors are automatically removed
   * const themeData: ColorDataIf = {
   *   colors: {
   *     primary: '#3498db',
   *     secondary: '#3498db',  // Duplicate
   *     tertiary: '#e74c3c'
   *   }
   * };
   * const colors = colorService.getRealColorsFromTheme(themeData);
   * // Returns: ['#3498db', '#e74c3c'] (duplicates removed)
   */
  getRealColorsFromTheme(cd: ColorDataIf): string[] {
    const ret: Set<string> = new Set();
    if (cd.colors) {
      for (const key in cd.colors) {
        if (cd.colors.hasOwnProperty(key)) {
          const value = cd.colors[key];
          if (this.isColorValue(value)) {
            ret.add(value);
          }
        }
      }
    }
    return ret.size > 0 ? Array.from(ret) : [];
  }

  /**
   * Inverts a CSS color value by applying color inversion algorithms appropriate to each format.
   * For RGB-based colors (hex, rgb, rgba), inverts by subtracting each channel from 255.
   * For HSL colors, inverts hue by adding 180° and lightness by subtracting from 100%.
   * For named colors, uses predefined color mappings.
   *
   * @param color - The color string to invert (hex, rgb, rgba, hsl, hsla, or named color)
   * @returns The inverted color in the same format, or the original color if inversion is not possible
   *
   * @example
   * // Hex colors (3, 6, and 8 character formats)
   * invertCssColor('#000')        // Returns '#fff'
   * invertCssColor('#ffffff')     // Returns '#000000'
   * invertCssColor('#ff0000ff')   // Returns '#00ffffff' (alpha preserved)
   *
   * @example
   * // RGB and RGBA colors
   * invertCssColor('rgb(255, 0, 0)')           // Returns 'rgb(0, 255, 255)'
   * invertCssColor('rgba(255, 0, 0, 0.5)')     // Returns 'rgba(0, 255, 255, 0.5)'
   *
   * @example
   * // HSL and HSLA colors
   * invertCssColor('hsl(0, 100%, 50%)')        // Returns 'hsl(180, 100%, 50%)'
   * invertCssColor('hsla(120, 50%, 25%, 0.5)') // Returns 'hsla(300, 50%, 75%, 0.5)'
   *
   * @example
   * // Named colors
   * invertCssColor('black')       // Returns '#ffffff'
   * invertCssColor('white')       // Returns '#000000'
   * invertCssColor('red')         // Returns '#00ffff'
   * invertCssColor('blue')        // Returns '#ffff00'
   *
   * @example
   * // CSS keywords (returned unchanged)
   * invertCssColor('transparent') // Returns 'transparent'
   * invertCssColor('inherit')     // Returns 'inherit'
   * invertCssColor('initial')     // Returns 'initial'
   * invertCssColor('unset')       // Returns 'unset'
   *
   * @example
   * // Invalid or unsupported colors
   * invertCssColor('')            // Returns ''
   * invertCssColor('invalid')     // Returns 'invalid'
   * invertCssColor('not-a-color') // Returns 'not-a-color'
   */
  invertCssColor(color: string): string {
    if (!color || !this.isColorValue(color)) {
      return color;
    }

    const trimmedColor = color.trim();

    // Handle hex colors
    if (trimmedColor.startsWith('#')) {
      return this.invertHexColor(trimmedColor);
    }

    // Handle rgb/rgba colors
    if (trimmedColor.startsWith('rgb')) {
      return this.invertRgbColor(trimmedColor);
    }

    // Handle hsl/hsla colors
    if (trimmedColor.startsWith('hsl')) {
      return this.invertHslColor(trimmedColor);
    }

    // Handle named colors
    if (this.isNamedColor(trimmedColor)) {
      return this.invertNamedColor(trimmedColor);
    }

    // Handle CSS keywords that shouldn't be inverted
    const cssKeywords = ['transparent', 'inherit', 'initial', 'unset'];
    if (cssKeywords.includes(trimmedColor.toLowerCase())) {
      return trimmedColor;
    }

    return color;
  }

  /**
   * Makes a color brighter by increasing its lightness
   * @param color - The color string to brighten (hex, rgb, rgba, hsl, hsla, or named color)
   * @param val - The amount to brighten (0-100, where 0 = no change, 100 = maximum brightness)
   * @returns The brightened color in the same format, or the original color if brightening is not possible
   * @example
   * // Brighten hex colors
   * colorService.brighter('#ff0000', 20); // Returns a brighter red
   * colorService.brighter('#336699', 50); // Returns a much brighter blue
   *
   * // Brighten RGB colors
   * colorService.brighter('rgb(255, 0, 0)', 30); // Returns brighter red in RGB format
   * colorService.brighter('rgba(100, 150, 200, 0.8)', 25); // Returns brighter blue with preserved alpha
   *
   * // Brighten HSL colors
   * colorService.brighter('hsl(240, 100%, 50%)', 40); // Returns brighter blue in HSL format
   * colorService.brighter('hsla(120, 60%, 40%, 0.9)', 35); // Returns brighter green with preserved alpha
   *
   * // Brighten named colors
   * colorService.brighter('red', 15); // Returns a brighter red
   * colorService.brighter('darkblue', 60); // Returns a much brighter blue
   *
   * // Edge cases
   * colorService.brighter('#ff0000', 0); // Returns '#ff0000' (no change)
   * colorService.brighter('invalid-color', 50); // Returns 'invalid-color' (unchanged)
   * colorService.brighter('#ff0000', -10); // Returns '#ff0000' (invalid val, unchanged)
   * colorService.brighter('#ff0000', 150); // Returns '#ff0000' (val > 100, unchanged)
   */
  brighter(color: string, val: number): string {
    if (!color || !this.isColorValue(color) || val < 0 || val > 100) {
      return color;
    }

    if (val === 0) {
      return color;
    }

    return this.adjustLightness(color, val);
  }

  /**
   * Makes a color darker by decreasing its lightness
   * @param color - The color string to darken (hex, rgb, rgba, hsl, hsla, or named color)
   * @param val - The amount to darken (0-100, where 0 = no change, 100 = maximum darkness)
   * @returns The darkened color in the same format, or the original color if darkening is not possible
   * @example
   * // Darken a hex color by 20%
   * colorService.darker('#ff0000', 20); // Returns a darker red, e.g., '#cc0000'
   *
   * // Darken an RGB color by 50%
   * colorService.darker('rgb(255, 0, 0)', 50); // Returns 'rgb(128, 0, 0)'
   *
   * // Darken a named color by 30%
   * colorService.darker('blue', 30); // Returns a darker blue
   *
   * // No change when val is 0
   * colorService.darker('#00ff00', 0); // Returns '#00ff00' (unchanged)
   *
   * // Invalid inputs return the original color
   * colorService.darker('invalid-color', 20); // Returns 'invalid-color'
   * colorService.darker('#ff0000', -10); // Returns '#ff0000' (val must be 0-100)
   */
  darker(color: string, val: number): string {
    if (!color || !this.isColorValue(color) || val < 0 || val > 100) {
      return color;
    }

    if (val === 0) {
      return color;
    }

    return this.adjustLightness(color, -val);
  }

  /**
   * Makes a color more transparent by adjusting its alpha channel
   * @param color - The color string to make transparent (hex, rgb, rgba, hsl, hsla, or named color)
   * @param val - The transparency amount (0-100, where 0 = no change, 100 = fully transparent)
   * @returns The color with adjusted transparency, or the original color if adjustment is not possible
   * @example
   * // Make a hex color 50% transparent
   * transparent('#ff0000', 50) // Returns 'rgba(255, 0, 0, 0.5)'
   *
   * // Make an RGB color 25% transparent
   * transparent('rgb(0, 255, 0)', 25) // Returns 'rgba(0, 255, 0, 0.75)'
   *
   * // Make an RGBA color more transparent
   * transparent('rgba(0, 0, 255, 0.8)', 30) // Returns 'rgba(0, 0, 255, 0.56)'
   *
   * // Make an HSL color transparent
   * transparent('hsl(120, 100%, 50%)', 40) // Returns 'hsla(120, 100%, 50%, 0.6)'
   *
   * // Make a named color transparent
   * transparent('red', 75) // Returns 'rgba(255, 0, 0, 0.25)'
   *
   * // No change when val is 0
   * transparent('#00ff00', 0) // Returns '#00ff00'
   *
   * // Invalid inputs return original color
   * transparent('invalid-color', 50) // Returns 'invalid-color'
   * transparent('#ff0000', -10) // Returns '#ff0000'
   * transparent('#ff0000', 150) // Returns '#ff0000'
   */
  transparent(color: string, val: number): string {
    if (!color || !this.isColorValue(color) || val < 0 || val > 100) {
      return color;
    }

    if (val === 0) {
      return color;
    }

    return this.adjustTransparency(color, val);
  }

  /**
   * Checks if a given string value represents a valid color.
   * Supports hex colors, RGB/RGBA, HSL/HSLA, CSS keywords, and named colors.
   * Excludes all CSS variables (including those with color suffix).
   *
   * @param value - The string value to check
   * @returns true if the value is a valid color, false otherwise
   *
   * @example
   * // Hex colors (3, 4, 6, or 8 characters)
   * isColorValue('#fff')        // true
   * isColorValue('#ffff')       // true
   * isColorValue('#ffffff')     // true
   * isColorValue('#ffffffff')   // true
   * isColorValue('#123abc')     // true
   *
   * @example
   * // RGB and RGBA colors
   * isColorValue('rgb(255, 0, 0)')           // true
   * isColorValue('rgba(255, 0, 0, 0.5)')     // true
   * isColorValue('rgb(255,0,0)')             // true (spaces optional)
   *
   * @example
   * // HSL and HSLA colors
   * isColorValue('hsl(120, 100%, 50%)')      // true
   * isColorValue('hsla(120, 100%, 50%, 0.8)') // true
   *
   * @example
   * // CSS keywords
   * isColorValue('transparent')  // true
   * isColorValue('inherit')      // true
   * isColorValue('initial')      // true
   * isColorValue('unset')        // true
   *
   * @example
   * // CSS variables (all return false)
   * isColorValue('var(--primary-color)')     // false
   * isColorValue('var(--background-color)')  // false
   *
   * @example
   * // Named colors
   * isColorValue('red')          // true
   * isColorValue('blue')         // true
   * isColorValue('aliceblue')    // true
   * isColorValue('rebeccapurple') // true
   *
   * @example
   * // Invalid values
   * isColorValue('var(--spacing)')       // false (CSS variable)
   * isColorValue('var(--primary-color)') // false (CSS variable, even with color suffix)
   * isColorValue('not-a-color')          // false (unknown color name)
   * isColorValue('#gg')                  // false (invalid hex characters)
   * isColorValue('rgb(300, 0, 0)')       // false (RGB values out of range)
   */
  isColorValue(value: string): boolean {
    if (value.startsWith('var(')) {
      return false;
    }

    const trimmedValue = value.trim();

    // Check for hex colors
    const hexRegex = /^#[0-9a-f]{3,8}$/i;
    if (hexRegex.test(trimmedValue)) {
      return true;
    }

    // Check for rgb/rgba colors
    const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i;
    if (rgbRegex.test(trimmedValue)) {
      return true;
    }

    // Check for hsl/hsla colors
    const hslRegex = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/i;
    if (hslRegex.test(trimmedValue)) {
      return true;
    }

    // Check for CSS keywords
    const cssKeywords = ['transparent', 'inherit', 'initial', 'unset'];
    if (cssKeywords.includes(trimmedValue.toLowerCase())) {
      return true;
    }

    // Check for CSS variable colors (but exclude them as per original logic)
    if (trimmedValue.match(/^var\(--.*-color\)$/i)) {
      return true;
    }

    // Check for named colors
    const namedColors = ['aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'];
    return namedColors.includes(trimmedValue.toLowerCase());
  }

  /**
   * Merges two colors using different blending modes
   * @param color1 - The first color (base color)
   * @param color2 - The second color (blend color)
   * @param ratio - The blend ratio (0-1, default: 0.5)
   * @param mode - The blending mode ('alpha', 'additive', 'average', default: 'alpha')
   * @returns The merged color in the same format as color1
   *
   * @example
   * // Basic usage with default parameters (50% alpha blend)
   * mergeColors('#ff0000', '#0000ff') // Returns '#800080' (purple)
   *
   * @example
   * // Alpha blending with custom ratio
   * mergeColors('#ff0000', '#0000ff', 0.3, 'alpha') // Returns '#b30033' (more red)
   * mergeColors('#ff0000', '#0000ff', 0.7, 'alpha') // Returns '#4d00cc' (more blue)
   *
   * @example
   * // Additive blending - adds colors together
   * mergeColors('#ff0000', '#00ff00', 0.5, 'additive') // Returns '#ff8000' (orange-ish)
   * mergeColors('#808080', '#404040', 0.5, 'additive') // Returns '#a0a0a0' (lighter gray)
   *
   * @example
   * // Average blending - averages the color values
   * mergeColors('#ff0000', '#00ff00', 0.5, 'average') // Returns '#808000' (olive)
   * mergeColors('#ffffff', '#000000', 0.3, 'average') // Returns '#b3b3b3' (light gray)
   *
   * @example
   * // Works with different color formats
   * mergeColors('rgb(255, 0, 0)', 'rgb(0, 0, 255)', 0.5) // Returns 'rgb(128, 0, 128)'
   * mergeColors('rgba(255, 0, 0, 0.8)', 'rgba(0, 0, 255, 0.6)', 0.5) // Returns 'rgba(128, 0, 128, 0.7)'
   * mergeColors('hsl(0, 100%, 50%)', 'hsl(240, 100%, 50%)', 0.5) // Returns equivalent merged color
   *
   * @example
   * // Edge cases
   * mergeColors('#ff0000', '#0000ff', 0) // Returns '#ff0000' (100% first color)
   * mergeColors('#ff0000', '#0000ff', 1) // Returns '#0000ff' (100% second color)
   * mergeColors('red', 'blue', 0.5) // Returns 'rgb(128, 0, 128)' (named colors converted)
   */
  mergeColors(color1: string, color2: string, ratio: number = 0.5, mode: 'alpha' | 'additive' | 'average' = 'alpha'): string {
    // Trim whitespace first
    const trimmedColor1 = color1?.trim() || '';
    const trimmedColor2 = color2?.trim() || '';

    if (!this.isColorValue(trimmedColor1) || !this.isColorValue(trimmedColor2)) {
      return color1;
    }

    // Clamp ratio between 0 and 1
    ratio = Math.max(0, Math.min(1, ratio));

    const rgba1 = this.colorToRgba(trimmedColor1);
    const rgba2 = this.colorToRgba(trimmedColor2);

    if (!rgba1 || !rgba2) {
      return color1;
    }

    let mergedRgba: { r: number; g: number; b: number; a: number };

    switch (mode) {
      case 'additive':
        mergedRgba = {
          r: Math.min(255, rgba1.r + (rgba2.r * ratio)),
          g: Math.min(255, rgba1.g + (rgba2.g * ratio)),
          b: Math.min(255, rgba1.b + (rgba2.b * ratio)),
          a: Math.max(rgba1.a, rgba2.a * ratio)
        };
        break;

      case 'average':
        mergedRgba = {
          r: rgba1.r * (1 - ratio) + rgba2.r * ratio,
          g: rgba1.g * (1 - ratio) + rgba2.g * ratio,
          b: rgba1.b * (1 - ratio) + rgba2.b * ratio,
          a: rgba1.a * (1 - ratio) + rgba2.a * ratio
        };
        break;

      case 'alpha':
      default:
        // Alpha blending: color1 * (1 - ratio) + color2 * ratio
        mergedRgba = {
          r: rgba1.r * (1 - ratio) + rgba2.r * ratio,
          g: rgba1.g * (1 - ratio) + rgba2.g * ratio,
          b: rgba1.b * (1 - ratio) + rgba2.b * ratio,
          a: rgba1.a * (1 - ratio) + rgba2.a * ratio
        };
        break;
    }

    // Round values
    mergedRgba.r = Math.round(mergedRgba.r);
    mergedRgba.g = Math.round(mergedRgba.g);
    mergedRgba.b = Math.round(mergedRgba.b);
    mergedRgba.a = Math.round(mergedRgba.a * 1000) / 1000; // Round to 3 decimal places

    return this.rgbaToOriginalFormat(mergedRgba, trimmedColor1);
  }

  /**
   * Blends two colors using alpha blending technique.
   *
   * Alpha blending combines two colors by treating the second color as a semi-transparent
   * overlay on top of the first color. The alpha parameter controls the opacity of the
   * overlay color, where 0 means completely transparent (only base color visible) and 1
   * means completely opaque (only overlay color visible).
   *
   * The blending formula used is: result = background * (1 - alpha) + foreground * alpha
   *
   * This method supports various color formats including hex (#rrggbb, #rgb), rgb/rgba,
   * hsl/hsla, and named colors. The output format matches the input format of the base color.
   *
   * @param color1 - The base (background) color in any valid CSS color format
   * @param color2 - The overlay (foreground) color in any valid CSS color format
   * @param alpha - The alpha/opacity value for the overlay color (0-1, where 0 = transparent, 1 = opaque)
   * @returns The blended color in the same format as the base color (color1)
   *
   * @example
   * // Basic alpha blending with hex colors
   * blendColorsAlpha('#ff0000', '#0000ff', 0.5) // Returns '#800080' (purple - 50% red, 50% blue)
   * blendColorsAlpha('#ffffff', '#000000', 0.3) // Returns '#b3b3b3' (light gray - 70% white, 30% black)
   *
   * @example
   * // Alpha blending with RGB colors
   * blendColorsAlpha('rgb(255, 0, 0)', 'rgb(0, 255, 0)', 0.25) // Returns 'rgb(191, 64, 0)' (mostly red with some green)
   * blendColorsAlpha('rgba(255, 0, 0, 0.8)', 'rgba(0, 0, 255, 0.6)', 0.5) // Blends with alpha channels
   *
   * @example
   * // Alpha blending with HSL colors
   * blendColorsAlpha('hsl(0, 100%, 50%)', 'hsl(120, 100%, 50%)', 0.4) // Red base with 40% green overlay
   * blendColorsAlpha('hsla(240, 100%, 50%, 0.9)', 'hsla(60, 100%, 50%, 0.7)', 0.6) // Blue base with yellow overlay
   *
   * @example
   * // Alpha blending with named colors
   * blendColorsAlpha('red', 'blue', 0.3) // Returns 'rgb(179, 0, 76)' (mostly red with some blue)
   * blendColorsAlpha('white', 'black', 0.1) // Returns 'rgb(230, 230, 230)' (very light gray)
   *
   * @example
   * // Edge cases and transparency effects
   * blendColorsAlpha('#ff0000', '#00ff00', 0) // Returns '#ff0000' (no overlay, pure base color)
   * blendColorsAlpha('#ff0000', '#00ff00', 1) // Returns '#00ff00' (full overlay, pure overlay color)
   * blendColorsAlpha('#ff0000', '#00ff00', 0.1) // Returns '#e61a00' (subtle green tint on red)
   * blendColorsAlpha('#ff0000', '#00ff00', 0.9) // Returns '#1ae600' (strong green with red undertone)
   *
   * @example
   * // Mixed color formats (output matches first color format)
   * blendColorsAlpha('#ff0000', 'rgb(0, 255, 0)', 0.5) // Returns '#808000' (hex format preserved)
   * blendColorsAlpha('rgb(255, 0, 0)', '#00ff00', 0.5) // Returns 'rgb(128, 128, 0)' (rgb format preserved)
   */
  blendColorsAlpha(color1: string, color2: string, alpha: number): string {
    // Trim whitespace first
    const trimmedColor1 = color1?.trim() || '';
    const trimmedColor2 = color2?.trim() || '';

    if (!this.isColorValue(trimmedColor1) || !this.isColorValue(trimmedColor2)) {
      return color1;
    }

    // Clamp alpha between 0 and 1
    alpha = Math.max(0, Math.min(1, alpha));

    const rgba1 = this.colorToRgba(trimmedColor1);
    const rgba2 = this.colorToRgba(trimmedColor2);

    if (!rgba1 || !rgba2) {
      return color1;
    }

    // Alpha blending formula: result = background * (1 - alpha) + foreground * alpha
    const blendedRgba = {
      r: Math.round(rgba1.r * (1 - alpha) + rgba2.r * alpha),
      g: Math.round(rgba1.g * (1 - alpha) + rgba2.g * alpha),
      b: Math.round(rgba1.b * (1 - alpha) + rgba2.b * alpha),
      a: Math.round((rgba1.a * (1 - alpha) + rgba2.a * alpha) * 1000) / 1000
    };

    return this.rgbaToOriginalFormat(blendedRgba, trimmedColor1);
  }

  private invertHexColor(hex: string): string {
    const cleanHex = hex.substring(1);
    let r: number, g: number, b: number, a: number | undefined;

    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    } else if (cleanHex.length === 8) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
      a = parseInt(cleanHex.substring(6, 8), 16);
    } else {
      return hex;
    }

    const invertedR = (255 - r).toString(16).padStart(2, '0');
    const invertedG = (255 - g).toString(16).padStart(2, '0');
    const invertedB = (255 - b).toString(16).padStart(2, '0');

    if (cleanHex.length === 3) {
      return `#${invertedR[0]}${invertedG[0]}${invertedB[0]}`;
    } else if (cleanHex.length === 6) {
      return `#${invertedR}${invertedG}${invertedB}`;
    } else if (cleanHex.length === 8 && a !== undefined) {
      const alphaHex = a.toString(16).padStart(2, '0');
      return `#${invertedR}${invertedG}${invertedB}${alphaHex}`;
    }

    return hex;
  }

  private invertRgbColor(rgb: string): string {
    const rgbaMatch = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (!rgbaMatch) {
      return rgb;
    }

    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4];

    const invertedR = 255 - r;
    const invertedG = 255 - g;
    const invertedB = 255 - b;

    if (a !== undefined) {
      return `rgba(${invertedR}, ${invertedG}, ${invertedB}, ${a})`;
    } else {
      return `rgb(${invertedR}, ${invertedG}, ${invertedB})`;
    }
  }

  private invertHslColor(hsl: string): string {
    const hslaMatch = hsl.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (!hslaMatch) {
      return hsl;
    }

    const h = parseInt(hslaMatch[1]);
    const s = parseInt(hslaMatch[2]);
    const l = parseInt(hslaMatch[3]);
    const a = hslaMatch[4];

    // Invert hue by adding 180 degrees (modulo 360)
    const invertedH = (h + 180) % 360;
    // Invert lightness
    const invertedL = 100 - l;

    if (a !== undefined) {
      return `hsla(${invertedH}, ${s}%, ${invertedL}%, ${a})`;
    } else {
      return `hsl(${invertedH}, ${s}%, ${invertedL}%)`;
    }
  }

  private isNamedColor(color: string): boolean {
    const namedColors = ['aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'];
    return namedColors.includes(color.toLowerCase());
  }

  private invertNamedColor(color: string): string {
    // Convert named color to RGB first, then invert
    const namedColorMap: { [key: string]: string } = {
      'black': '#ffffff',
      'white': '#000000',
      'red': '#00ffff',
      'green': '#ff00ff',
      'blue': '#ffff00',
      'yellow': '#0000ff',
      'cyan': '#ff0000',
      'magenta': '#00ff00',
      'gray': '#808080',
      'grey': '#808080',
      'darkgray': '#a9a9a9',
      'darkgrey': '#a9a9a9',
      'lightgray': '#565656',
      'lightgrey': '#565656',
      'orange': '#0080ff',
      'purple': '#80ff00',
      'pink': '#008040',
      'brown': '#4080ff',
      'navy': '#ffff80',
      'lime': '#ff0080',
      'olive': '#8000ff',
      'maroon': '#80ffff',
      'teal': '#ff8080',
      'silver': '#404040',
      'aqua': '#ff0000',
      'fuchsia': '#00ff00'
    };

    const lowerColor = color.toLowerCase();
    return namedColorMap[lowerColor] || color;
  }

  private adjustLightness(color: string, adjustment: number): string {
    const trimmedColor = color.trim();

    // Convert to RGBA for RGB-based adjustment
    const rgba = this.colorToRgba(trimmedColor);
    if (!rgba) {
      return color;
    }

    // RGB-based lightness adjustment
    let newR: number, newG: number, newB: number;

    if (adjustment > 0) {
      // Brighter: add to each channel proportionally to remaining space
      const factor = adjustment / 100;
      newR = rgba.r + (255 - rgba.r) * factor;
      newG = rgba.g + (255 - rgba.g) * factor;
      newB = rgba.b + (255 - rgba.b) * factor;
    } else {
      // Darker: reduce each channel proportionally
      const factor = 1 + (adjustment / 100); // adjustment is negative for darker
      newR = rgba.r * factor;
      newG = rgba.g * factor;
      newB = rgba.b * factor;
    }

    // Clamp values to 0-255 range
    newR = Math.max(0, Math.min(255, Math.round(newR)));
    newG = Math.max(0, Math.min(255, Math.round(newG)));
    newB = Math.max(0, Math.min(255, Math.round(newB)));

    const adjustedRgba = {r: newR, g: newG, b: newB, a: rgba.a};

    // Convert back to original format
    return this.rgbaToOriginalFormat(adjustedRgba, trimmedColor);
  }

  private adjustTransparency(color: string, transparencyAmount: number): string {
    const trimmedColor = color.trim();

    // Convert to RGBA for alpha adjustment
    const rgba = this.colorToRgba(trimmedColor);
    if (!rgba) {
      return color;
    }

    // Calculate new alpha (reduce opacity by transparencyAmount percentage)
    const alphaReduction = transparencyAmount / 100;
    let newAlpha = rgba.a * (1 - alphaReduction);
    newAlpha = Math.max(0, Math.min(1, Math.round(newAlpha * 1000) / 1000));

    const adjustedRgba = {...rgba, a: newAlpha};

    // Convert back to original format with alpha
    return this.rgbaToOriginalFormat(adjustedRgba, trimmedColor);
  }

  private colorToHsl(color: string): { h: number; s: number; l: number; a: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const rgba = this.hexToRgba(color);
      return rgba ? this.rgbaToHsl(rgba) : null;
    }

    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      const rgba = this.parseRgba(color);
      return rgba ? this.rgbaToHsl(rgba) : null;
    }

    // Handle hsl/hsla colors
    if (color.startsWith('hsl')) {
      return this.parseHsla(color);
    }

    // Handle named colors
    if (this.isNamedColor(color)) {
      const rgba = this.namedColorToRgba(color);
      return rgba ? this.rgbaToHsl(rgba) : null;
    }

    return null;
  }

  private colorToRgba(color: string): { r: number; g: number; b: number; a: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      return this.hexToRgba(color);
    }

    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      return this.parseRgba(color);
    }

    // Handle hsl/hsla colors
    if (color.startsWith('hsl')) {
      const hsl = this.parseHsla(color);
      return hsl ? this.hslToRgba(hsl) : null;
    }

    // Handle named colors
    if (this.isNamedColor(color)) {
      return this.namedColorToRgba(color);
    }

    return null;
  }

  private hexToRgba(hex: string): { r: number; g: number; b: number; a: number } | null {
    const cleanHex = hex.substring(1);
    let r: number, g: number, b: number, a: number = 1;

    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    } else if (cleanHex.length === 8) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
      a = parseInt(cleanHex.substring(6, 8), 16) / 255;
    } else {
      return null;
    }

    return {r, g, b, a};
  }

  private parseRgba(rgb: string): { r: number; g: number; b: number; a: number } | null {
    const rgbaMatch = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (!rgbaMatch) {
      return null;
    }

    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

    return {r, g, b, a};
  }

  private parseHsla(hsl: string): { h: number; s: number; l: number; a: number } | null {
    const hslaMatch = hsl.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (!hslaMatch) {
      return null;
    }

    const h = parseInt(hslaMatch[1]);
    const s = parseInt(hslaMatch[2]);
    const l = parseInt(hslaMatch[3]);
    const a = hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1;

    return {h, s, l, a};
  }

  private namedColorToRgba(color: string): { r: number; g: number; b: number; a: number } | null {
    // Basic named color to RGB mapping
    const namedColorMap: { [key: string]: { r: number; g: number; b: number } } = {
      'black': {r: 0, g: 0, b: 0},
      'white': {r: 255, g: 255, b: 255},
      'red': {r: 255, g: 0, b: 0},
      'green': {r: 0, g: 128, b: 0},
      'blue': {r: 0, g: 0, b: 255},
      'yellow': {r: 255, g: 255, b: 0},
      'cyan': {r: 0, g: 255, b: 255},
      'magenta': {r: 255, g: 0, b: 255},
      'gray': {r: 128, g: 128, b: 128},
      'grey': {r: 128, g: 128, b: 128},
      'orange': {r: 255, g: 165, b: 0},
      'purple': {r: 128, g: 0, b: 128},
      'pink': {r: 255, g: 192, b: 203},
      'brown': {r: 165, g: 42, b: 42},
      'navy': {r: 0, g: 0, b: 128},
      'lime': {r: 0, g: 255, b: 0},
      'olive': {r: 128, g: 128, b: 0},
      'maroon': {r: 128, g: 0, b: 0},
      'teal': {r: 0, g: 128, b: 128},
      'silver': {r: 192, g: 192, b: 192}
    };

    const lowerColor = color.toLowerCase();
    const rgb = namedColorMap[lowerColor];
    return rgb ? {...rgb, a: 1} : null;
  }

  private rgbaToHsl(rgba: { r: number; g: number; b: number; a: number }): {
    h: number;
    s: number;
    l: number;
    a: number
  } {
    const r = rgba.r / 255;
    const g = rgba.g / 255;
    const b = rgba.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;

      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: rgba.a
    };
  }

  private hslToRgba(hsl: { h: number; s: number; l: number; a: number }): {
    r: number;
    g: number;
    b: number;
    a: number
  } {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: hsl.a
    };
  }

  private hslToOriginalFormat(hsl: { h: number; s: number; l: number; a: number }, originalColor: string): string {
    // If original was HSL/HSLA, return in HSL format
    if (originalColor.startsWith('hsl')) {
      if (originalColor.includes('hsla') || hsl.a < 1) {
        return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
      } else {
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      }
    }

    // Convert to RGBA and then to original format
    const rgba = this.hslToRgba(hsl);
    return this.rgbaToOriginalFormat(rgba, originalColor);
  }

  private rgbaToOriginalFormat(rgba: { r: number; g: number; b: number; a: number }, originalColor: string): string {
    // If original was hex, return in hex format
    if (originalColor.startsWith('#')) {
      const r = Math.round(rgba.r).toString(16).padStart(2, '0');
      const g = Math.round(rgba.g).toString(16).padStart(2, '0');
      const b = Math.round(rgba.b).toString(16).padStart(2, '0');

      if (rgba.a < 1) {
        const a = Math.round(rgba.a * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}${a}`;
      } else {
        return `#${r}${g}${b}`;
      }
    }

    // If original was RGB/RGBA, return in RGB format
    if (originalColor.startsWith('rgb')) {
      if (originalColor.includes('rgba') || rgba.a < 1) {
        return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${rgba.a})`;
      } else {
        return `rgb(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)})`;
      }
    }

    // If original was HSL/HSLA, convert to HSL
    if (originalColor.startsWith('hsl')) {
      const hsl = this.rgbaToHsl(rgba);
      if (originalColor.includes('hsla') || rgba.a < 1) {
        return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
      } else {
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      }
    }

    // If original was named color, return as RGBA if alpha < 1, otherwise try to keep as named
    if (this.isNamedColor(originalColor)) {
      if (rgba.a < 1) {
        return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${rgba.a})`;
      }
      // For named colors, we'll return the RGB equivalent since we can't easily map back to named colors
      return `rgb(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)})`;
    }

    // Default fallback
    return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${rgba.a})`;
  }
}