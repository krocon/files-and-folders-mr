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
   * Makes a color brighter by increasing its lightness
   * @param color - The color string to brighten (hex, rgb, rgba, hsl, hsla, or named color)
   * @param val - The amount to brighten (0-100, where 0 = no change, 100 = maximum brightness)
   * @returns The brightened color in the same format, or the original color if brightening is not possible
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

  /**
   * Merges two colors using different blending modes
   * @param color1 - The first color (base color)
   * @param color2 - The second color (blend color)
   * @param ratio - The blend ratio (0-1, default: 0.5)
   * @param mode - The blending mode ('alpha', 'additive', 'average', default: 'alpha')
   * @returns The merged color in the same format as color1
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
   * Blends two colors using alpha blending
   * @param color1 - The base color
   * @param color2 - The overlay color
   * @param alpha - The alpha value for color2 (0-1)
   * @returns The blended color in the same format as color1
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
}