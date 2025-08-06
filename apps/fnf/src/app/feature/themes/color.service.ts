import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

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
    const namedColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey'];
    return namedColors.includes(trimmedValue.toLowerCase());
  }
}