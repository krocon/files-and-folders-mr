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