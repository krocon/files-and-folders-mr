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
    const fileName = this.stripPrefixPatterns(rawFileName);

    // Try different grouping strategies in order of specificity

    // 1. Check for series with year patterns (e.g., "Mickyvision II Serie 1967 01")
    const yearSeriesMatch = this.matchYearSeries(fileName);
    if (yearSeriesMatch) {
      return yearSeriesMatch;
    }

    // 2. Check for numbered series (e.g., "Deep State 01", "The Fable 01")
    const numberedSeriesMatch = this.matchNumberedSeries(fileName);
    if (numberedSeriesMatch) {
      return numberedSeriesMatch;
    }

    // 3. Check for gesamtausgabe/collection series (e.g., "Lady S Gesamtausgabe 1")
    const collectionMatch = this.matchCollectionSeries(fileName);
    if (collectionMatch) {
      return collectionMatch;
    }

    // 4. Check for directory-based grouping (files in same subdirectory)
    const directoryMatch = this.matchDirectoryGroup(filePath);
    if (directoryMatch) {
      return directoryMatch;
    }

    // 5. Check for similar title patterns (e.g., "Staehlerne Herzen 01", "Staehlerne Herzen 02")
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
   * Matches series with year patterns like "Mickyvision II Serie 1967 01"
   */
  private matchYearSeries(fileName: string): string | null {
    // Pattern for series with years like "Mickyvision II Serie 1967 01"
    const yearPattern = /^(.+?)\s+(\d{4})\s+\d+/;
    const match = fileName.match(yearPattern);

    if (match) {
      const seriesName = match[1].trim();
      const year = match[2];
      return `${seriesName}/${year}`;
    }

    return null;
  }

  /**
   * Matches numbered series like "Deep State 01", "The Fable 01"
   */
  private matchNumberedSeries(fileName: string): string | null {
    // Pattern for numbered series - look for title followed by number
    const patterns = [
      // Pattern like "Deep State 01 Die dunklere Seite"
      /^(.+?)\s+(\d{1,3})\s+/,
      // Pattern like "Adolf 01 (GER)"
      /^(.+?)\s+(\d{1,3})\s*\(/,
      // Pattern like "Star Fantasy 1 [13]"
      /^(.+?)\s+(\d{1,3})\s*\[/,
      // Pattern like "LTB Crime 01"
      /^(.+?)\s+(\d{1,3})(?:\s|$)/
    ];

    for (const pattern of patterns) {
      const match = fileName.match(pattern);
      if (match) {
        const seriesName = match[1].trim();
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
   */
  private matchCollectionSeries(fileName: string): string | null {
    // Pattern for collection series with numbers (including leading zeros)
    const collectionPattern = /^(.+?)\s+(Gesamtausgabe|Collection|Anthology)\s+\d+/i;
    const match = fileName.match(collectionPattern);

    if (match) {
      return match[1].trim();
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
    const genericNames = ['Band', 'Teil', 'Volume', 'Vol', 'Book', 'Buch', 'Heft', 'Issue'];
    return genericNames.some(generic => name.toLowerCase().includes(generic.toLowerCase()));
  }

  /**
   * Checks if a directory name is too generic for grouping
   */
  private isGenericDirectoryName(dirName: string): boolean {
    const genericDirs = ['comics', 'books', 'ebooks', 'files'];
    return genericDirs.some(generic => dirName.toLowerCase().includes(generic.toLowerCase()));
  }
}