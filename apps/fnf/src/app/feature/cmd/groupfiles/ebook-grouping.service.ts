import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EbookGroupingService {


  /**
   * Groups an array of file paths into logical groups based on series names, volumes, and years.
   * @param input Array of file paths to group
   * @returns Object with group names as keys and arrays of file paths as values
   */
  groupFiles(input: string[]): { [key: string]: string[] } {
    const groups: { [key: string]: string[] } = {};
    const various: string[] = [];

    // Process each file path
    for (const filePath of input) {
      const groupKey = this.determineGroupKey(filePath);

      if (groupKey === '_various') {
        various.push(filePath);
      } else {
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(filePath);
      }
    }

    // Add _various files if any exist
    if (various.length > 0) {
      groups['_various'] = various;
    }

    return groups;
  }

  /**
   * Determines the appropriate group key for a given file path
   * @param filePath The file path to analyze
   * @returns The group key or '_various' if no pattern is found
   */
  private determineGroupKey(filePath: string): string {
    // Extract filename from path and strip [*] prefix patterns
    const rawFileName = this.extractFileName(filePath);
    const strippedFileName = this.stripPrefixPatterns(rawFileName);
    // Normalize filename by converting underscores to spaces for better pattern matching
    const fileName = this.normalizeFileName(strippedFileName);

    // Try different grouping strategies in order of specificity

    // 1. Check for series with year patterns (e.g., "Mickyvision II Serie 1967 01")
    const yearSeriesMatch = this.matchYearSeries(fileName);
    if (yearSeriesMatch) {
      return yearSeriesMatch;
    }

    // 2. Check for gesamtausgabe/collection series (e.g., "Lady S Gesamtausgabe 1", "Jeff Jordan Gesamtausgabe - 1")
    const collectionMatch = this.matchCollectionSeries(fileName);
    if (collectionMatch) {
      return collectionMatch;
    }

    // 3. Check for titles with parenthetical information (e.g., "Bleierne Hitze (Edition 52 2013)(KeiPsf)")
    const parentheticalMatch = this.matchParentheticalTitles(fileName);
    if (parentheticalMatch) {
      return parentheticalMatch;
    }

    // 4. Check for numbered series (e.g., "Deep State 01", "The Fable 01")
    const numberedSeriesMatch = this.matchNumberedSeries(fileName);
    if (numberedSeriesMatch) {
      return numberedSeriesMatch;
    }

    // 5. Check for directory-based grouping (files in same subdirectory)
    const directoryMatch = this.matchDirectoryGroup(filePath);
    if (directoryMatch) {
      return directoryMatch;
    }

    // 6. Check for similar title patterns (e.g., "Staehlerne Herzen 01", "Staehlerne Herzen 02")
    const titleMatch = this.matchSimilarTitles(fileName);
    if (titleMatch) {
      return titleMatch;
    }

    return '_various';
  }

  /**
   * Extracts the filename from a full path
   */
  private extractFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  /**
   * Strips [*] patterns from the beginning of filenames
   * e.g., "[GER] Das Hoellenpack 01" becomes "Das Hoellenpack 01"
   */
  private stripPrefixPatterns(fileName: string): string {
    // Remove [*] patterns from the beginning of the filename
    return fileName.replace(/^\[.*?\]\s*/, '');
  }

  /**
   * Normalizes filename for better pattern matching
   * - Converts underscores to spaces
   * - Cleans up multiple spaces
   */
  private normalizeFileName(fileName: string): string {
    return fileName
      .replace(/_/g, ' ')  // Convert underscores to spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Matches series with year patterns like "Mickyvision II Serie 1967 01"
   * Only matches when the year is part of the series structure, not publication metadata in parentheses
   */
  private matchYearSeries(fileName: string): string | null {
    // Pattern for series with years like "Mickyvision II Serie 1967 01"
    // But exclude cases where the year appears inside parentheses (publication metadata)
    const yearPattern = /^(.+?)\s+(\d{4})\s+\d+/;
    const match = fileName.match(yearPattern);

    if (match) {
      const fullMatch = match[0];
      const seriesName = match[1].trim();
      const year = match[2];

      // Don't match if the year appears to be inside parentheses (publication metadata)
      // Check if there's an opening parenthesis before the year without a closing one
      const beforeYear = fileName.substring(0, fileName.indexOf(year));
      const openParens = (beforeYear.match(/\(/g) || []).length;
      const closeParens = (beforeYear.match(/\)/g) || []).length;

      if (openParens > closeParens) {
        // Year is inside parentheses, likely publication metadata
        return null;
      }
      
      return `${seriesName}/${year}`;
    }

    return null;
  }

  /**
   * Matches numbered series like "Deep State 01", "The Fable 01", "Nomad 001"
   */
  private matchNumberedSeries(fileName: string): string | null {
    // Pattern for numbered series - look for title followed by number
    const patterns = [
      // Pattern like "Nomad 001 - Lebendige Erinnerung" (3-digit with dash)
      /^(.+?)\s+(\d{3})\s*-/,
      // Pattern like "Pluto - Urasawa X Tezuka - 01 -" (complex dash pattern)
      /^(.+?)\s*-\s*(.+?)\s*-\s*(\d{1,3})\s*-/,
      // Pattern like "Homunculus - New Edition - 01 -" (edition with number)
      /^(.+?)\s*-\s*(New Edition|Gesamtausgabe|Collection)\s*-\s*(\d{1,3})\s*-/,
      // Pattern like "Deep State 01 Die dunklere Seite"
      /^(.+?)\s+(\d{1,3})\s+/,
      // Pattern like "Adolf 01 (GER)"
      /^(.+?)\s+(\d{1,3})\s*\(/,
      // Pattern like "Star Fantasy 1 [13]"
      /^(.+?)\s+(\d{1,3})\s*\[/,
      // Pattern like "Himmel in Truemmern 01.cbr" or "Series 05.jpg"
      /^(.+?)\s+(\d{1,3})\./,
      // Pattern like "LTB Crime 01"
      /^(.+?)\s+(\d{1,3})(?:\s|$)/
    ];

    for (const pattern of patterns) {
      const match = fileName.match(pattern);
      if (match) {
        let seriesName = match[1].trim();

        // Handle complex patterns with multiple parts
        if (pattern.source.includes('-.*-.*-')) {
          // For patterns like "Pluto - Urasawa X Tezuka - 01 -"
          if (match[2]) {
            seriesName = `${match[1].trim()} - ${match[2].trim()}`;
          }
        } else if (pattern.source.includes('New Edition|Gesamtausgabe|Collection')) {
          // For patterns like "Homunculus - New Edition - 01 -"
          if (match[2]) {
            seriesName = `${match[1].trim()} - ${match[2].trim()}`;
          }
        }
        
        // Filter out very generic or short names
        if (seriesName.length > 2 && !this.isGenericName(seriesName)) {
          return seriesName;
        }
      }
    }

    return null;
  }

  /**
   * Matches collection series like "Lady S Gesamtausgabe 1" or "Lady S Gesamtausgabe 03"
   * Also handles patterns with dash separators like "Jeff Jordan Gesamtausgabe - 1 - ..."
   */
  private matchCollectionSeries(fileName: string): string | null {
    // Pattern for collection series with numbers (including leading zeros)
    // Handles both "Series Gesamtausgabe 1" and "Series Gesamtausgabe - 1 - ..." formats
    const collectionPatterns = [
      // Pattern like "Jeff Jordan Gesamtausgabe - 1 - ..."
      /^(.+?)\s+(Gesamtausgabe|Collection|Anthology)\s*-\s*\d+/i,
      // Pattern like "Lady S Gesamtausgabe 1"
      /^(.+?)\s+(Gesamtausgabe|Collection|Anthology)\s+\d+/i
    ];

    for (const pattern of collectionPatterns) {
      const match = fileName.match(pattern);
      if (match) {
        // Return the full series name including the collection type (e.g., "Jeff Jordan Gesamtausgabe")
        return `${match[1].trim()} ${match[2]}`;
      }
    }

    return null;
  }

  /**
   * Matches files in the same subdirectory for grouping
   */
  private matchDirectoryGroup(filePath: string): string | null {
    const pathParts = filePath.split('/');

    // If file is in a subdirectory (not root Comics.nosync), use directory name
    if (pathParts.length > 3) {
      const directoryName = pathParts[pathParts.length - 2];

      // Skip generic directory names
      if (!this.isGenericDirectoryName(directoryName)) {
        return directoryName;
      }
    }

    return null;
  }

  /**
   * Matches titles with parenthetical information like "Bleierne Hitze (Edition 52 2013)(KeiPsf)"
   * Only matches when there's no numbered series pattern anywhere in the title
   */
  private matchParentheticalTitles(fileName: string): string | null {
    // Don't match if this contains any numbers before the parenthesis (likely a numbered series)
    const hasNumbersPattern = /^[^(]*\d+[^(]*\(/;
    if (hasNumbersPattern.test(fileName)) {
      return null;
    }

    // Pattern for titles followed by parenthetical information (no numbers before parenthesis)
    const parentheticalPattern = /^(.+?)\s*\(/;
    const match = fileName.match(parentheticalPattern);

    if (match) {
      const title = match[1].trim();
      // Only return if title is meaningful (not too short, not generic)
      if (title.length > 3 && !this.isGenericName(title)) {
        return title;
      }
    }

    return null;
  }

  /**
   * Matches similar titles that might be part of a series
   */
  private matchSimilarTitles(fileName: string): string | null {
    // Look for patterns like "Staehlerne Herzen 01", "Staehlerne Herzen 02"
    const titlePattern = /^(.+?)\s+\d{1,3}(?:\s|$|\()/;
    const match = fileName.match(titlePattern);

    if (match) {
      const title = match[1].trim();
      if (title.length > 3 && !this.isGenericName(title)) {
        return title;
      }
    }

    return null;
  }

  /**
   * Checks if a name is too generic to be used for grouping
   */
  private isGenericName(name: string): boolean {
    const genericNames = ['Teil', 'Volume', 'Vol', 'Book', 'Buch', 'Heft', 'Issue'];

    // Check for generic names, but be more lenient with "Band" if it's part of a longer name
    const hasGeneric = genericNames.some(generic => {
      const regex = new RegExp(`\\b${generic}\\b`, 'i');
      return regex.test(name);
    });

    if (hasGeneric) {
      return true;
    }

    // Special handling for "Band" - only consider it generic if it's the only meaningful word
    // or if the name is very short
    if (/\bBand\b/i.test(name)) {
      // Allow "Band" if it's part of a longer, meaningful title
      const words = name.split(/\s+/).filter(word => word.length > 2);
      return words.length <= 2; // Generic if only "Band" + one other short word
    }

    return false;
  }

  /**
   * Checks if a directory name is too generic for grouping
   */
  private isGenericDirectoryName(dirName: string): boolean {
    const genericDirs = ['comics', 'books', 'ebooks', 'files', '__out', 'out', 'output'];
    return genericDirs.some(generic => dirName.toLowerCase().includes(generic.toLowerCase()));
  }
}