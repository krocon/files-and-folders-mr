import {Injectable} from '@angular/core';
import {ColorDataIf} from "@fnf-data";

@Injectable({
  providedIn: 'root'
})
export class ColorService {


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
   * Inverts a CSS color value
   * @param color - The color string to invert (hex, rgb, rgba, hsl, hsla, or named color)
   * @returns The inverted color in the same format, or the original color if inversion is not possible
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

  /**
   * Checks if a given string value represents a valid color
   * @param value - The string value to check
   * @returns true if the value is a valid color, false otherwise
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
}