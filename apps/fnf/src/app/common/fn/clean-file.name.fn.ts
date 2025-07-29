

/**
 * Cleans a filename by removing technical information while preserving the meaningful title and year.
 *
 * This function is designed to extract the core title from media filenames by:
 * 1. Removing file extensions
 * 2. Detecting and keeping the release year (if present)
 * 3. Removing technical information like resolution, codecs, release groups, languages, etc.
 * 4. Normalizing spacing and punctuation
 *
 * The function is particularly useful for media files (movies, TV shows) that often include
 * technical metadata in their filenames.
 *
 * @param {string} name - The filename to clean
 * @returns {string} The cleaned filename with only essential information preserved
 *
 * @example
 * // Returns "The.Matrix.1999"
 * cleanFileName("The.Matrix.1999.4K.HDR.DTS-HD.MA.5.1.x265-YIFY.mkv");
 *
 * @example
 * // Returns "Breaking.Bad.S01E01"
 * cleanFileName("Breaking.Bad.S01E01.720p.HDTV.x264-LOL.mp4");
 *
 * @example
 * // Returns "Documentary.2020"
 * cleanFileName("Documentary.2020.EXTENDED.1080p.WEB-DL.H264.AC3-EVO.mp4");
 *
 * @example
 * // Returns empty string for empty input
 * cleanFileName(""); // returns ""
 */
export function cleanFileName(name: string): string {
  if (!name) return '';

  // Remove file extension
  let cleanName = name.replace(/\.[^.]+$/, '')+' ';

  // List of technical tokens to remove (case insensitive)
  const technicalTokens = [
    // Languages
    'german', 'english', 'french', 'spanish', 'italian', 'russian', 'japanese', 'chinese',
    'korean', 'dutch', 'swedish', 'danish', 'norwegian', 'finnish', 'polish', 'portuguese',
    'multi', 'multilingual',

    // Resolutions
    '1080p', '720p', '2160p', '4k', 'uhd', '480p', '576p', 'hd', 'sd', 'fullhd', 'qhd',

    // Sources
    'bluray', 'bdrip', 'brrip', 'dvdrip', 'dvd', 'hdrip', 'webrip', 'web-dl', 'webdl',
    'amzn', 'netflix', 'nf', 'hulu', 'disney', 'hbo', 'tv', 'rs', 'hdtv', 'pdtv',

    // Codecs
    'x264', 'x265', 'h264', 'h265', 'hevc', 'xvid', 'divx', 'aac', 'ac3', 'dts', 'mp3',
    'flac', 'opus',

    // Release groups (common ones)
    'axxo', 'yify', 'rarbg', 'eztv', 'ettv', 'lol', 'fov', 'immerse', 'dim', 'mtb',
    'internal', 'proper', 'repack', 'rerip', 'real', 'retail', 'extended', 'unrated',
    'directors', 'cut', 'theatrical', 'limited', 'complete',

    // Other technical info
    'remux', 'hdr', 'hdr10', 'dolby', 'vision', 'atmos', 'truehd', 'dts-hd', 'dtshd',
    '5.1', '7.1', '2.0', 'dual', 'audio', 'subs', 'subbed', 'dubbed',

    // Additional technical terms
    'ma', 'dts-hd', 'dtshd', 'dts'
  ];

  // Extract year (assuming it's a 4-digit number between 1900 and 2099)
  const yearMatch = cleanName.match(/(?:^|\D)(19\d{2}|20\d{2})(?:\D|$)/);
  const year = yearMatch ? yearMatch[1] : null;

  // If we found a year, keep everything up to and including the year
  if (year) {
    const yearIndex = cleanName.indexOf(year) + year.length;
    cleanName = cleanName.substring(0, yearIndex+1);
  } else {
    // If no year found, try to remove technical tokens

    // Remove release group (anything after a dash)
    cleanName = cleanName.replace(/-[^-]*$/, '');

    // Remove technical tokens one by one
    for (const token of technicalTokens) {
      // Create a regex that matches the token with word boundaries
      const tokenRegex = new RegExp(`(?:^|\\.|\\s)${token}(?:\\.|\\s|$)`, 'gi');
      cleanName = cleanName.replace(tokenRegex, '.');
    }
  }

  // Fix formatting issues
  cleanName = cleanName
    // Replace multiple dots with a single dot
    .replace(/\.{2,}/g, '.')
    // Replace multiple spaces with a single space
    .replace(/\s{2,}/g, ' ')
    // Remove dots or spaces at the beginning or end
    .replace(/^[\s.]+|[\s.]+$/g, '')
    // Replace dot-space or space-dot with just a dot
    .replace(/\.\s|\s\./g, '.')
    .trim();

  return cleanName;
}
