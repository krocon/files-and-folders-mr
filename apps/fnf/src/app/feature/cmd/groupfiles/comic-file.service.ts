import {Injectable} from '@angular/core';


/*

# Erweitere ComicFileService, so dass die Methode groupFiles() folgendes macht:

Eine Liste von Dateinamen (string[]) wird in eine Map von Gruppennamen (string) und Dateinamen (string[]) umgewandelt.
Beispiel:

const input = [
    "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_08_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
    "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_09_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
    "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_10_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
    "/Users/userabc/Filme.nosync/comics4/Nomad_001_-_Lebendige_Erinnerung_(1995)_(Kult)_(c2c)_(danyberg).cbr",
    "/Users/userabc/Filme.nosync/comics4/Nomad_002_-_Gai-Jin_(1995)_(Kult)_(c2c)_(danyberg).cbr",
    "/Users/userabc/Filme.nosync/comics4/Francois Schuiten - Jenseits der Grenze - Band 1.cbr",
    "/Users/userabc/Filme.nosync/comics4/Francois_Schuiten_-_Jenseits_der_Grenze_-_Band_2.cbr",
    "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 01.cbr",
    "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 02.cbr"
]

output:
{
  "Homunculus/New Edition": [
      "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_08_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
      "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_09_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
      "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_10_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz"
  ].
  "Nomad": [
      "/Users/userabc/Filme.nosync/comics4/Nomad_001_-_Lebendige_Erinnerung_(1995)_(Kult)_(c2c)_(danyberg).cbr",
      "/Users/userabc/Filme.nosync/comics4/Nomad_002_-_Gai-Jin_(1995)_(Kult)_(c2c)_(danyberg).cbr"
  ],
  "Francois Schuiten/Jenseits der Grenze": [
      "/Users/userabc/Filme.nosync/comics4/Francois Schuiten - Jenseits der Grenze - Band 1.cbr",
      "/Users/userabc/Filme.nosync/comics4/Francois_Schuiten_-_Jenseits_der_Grenze_-_Band_2.cbr"
  ],
  "Mickyvision II Serie 1967": [
      "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 01.cbr",
      "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 02.cbr"
  ]
}

Key: Gruppe (string)
Value: Array von original Dateinamen


## Gehe wie folgt vor:

Grundsätzlich: arbeite sehr generisch. Nutze keine Listen (Regex) mit hartkodierten Wörtern wie 'Buch', 'Teil', 'Part' usw.

1) Schaue dir den File base an:  "Homunculus_-_New_Edition_-_08_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz".

  Ignoriere in der Base alles in '[...]' und '(...)', z.B. [GER] oder (Panini)

  Suche in Base eine Running-Number, wie z.B. 08. Bei der Suche kannst du dir die Vorgänger und Nachfolger anschauen,
  ob es sich wirklich um eine  Running-Number handelt.
  Eine Running-Number kann bestehen aus lateinischen Zahlen (0-9) oder römischen Zahlem (I,II,III,IV...) bestehen.

2a)  Wenn es sich um eine Running-Number handelt, betrachten wir den linken Teil , z.B. "Homunculus_-_New_Edition_-_".
   -  Wir ersetzen '_' durch ' ' und trimmen den String: "Homunculus - New_Edition"
   -  Wenn der String kein '-' enthält, dann ist der String die Gruppe, z.B. "Nomad".
   -  Wenn der String  '-' enthält, dann wird diese dort gesplittet und (nach trim) germerged mit '/', also Gruppe = "Homunculus/New Edition".

     Aber 1: Das Wort an der Running-Number, das nicht mit '-' von der Nummer getrennt ist (z.B. "Band 1"), wird beim merge nicht berücksichtig,
     also "Francois Schuiten - Jenseits der Grenze - Band 1.cbr" -> ["Francois Schuiten", "Jenseits der Grenze"] -> "Francois Schuiten/Jenseits der Grenze".
     Regel: "WORD1 - WORD2 - WORD3 RUNNING_NUMBER" -> "WORD1 - WORD2" -> Group: "WORD1/WORD2"

2b) Wenn wir keine Running-Number gefunden haben, dann lautet die Gruppe "_various".

*/
@Injectable({
  providedIn: 'root'
})
export class ComicFileService {

  groupFiles(files: string[]): { [key: string]: string[] } {
    if (files.length === 0) return {};

    const groups: { [key: string]: string[] } = {};

    for (const file of files) {
      const groupName = this.extractGroupName(file);

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(file);
    }

    return groups;
  }

  private extractGroupName(filePath: string): string {
    try {
      // Extract filename from full path
      const filename = filePath.split('/').pop() || filePath;

      const basename = filename
        .replace(/\.[^/.]+$/, '')// Remove file extension
        .replace(/\.[,;]+$/, '');// Remove ,; extension

      // Remove content in [...] and (...) brackets
      const cleaned = basename.replace(/\[[^\]]*\]/g, '').replace(/\([^\)]*\)/g, '').trim();

      // Find the last number in the string (running number)
      const numberMatch = this.findLastNumber(cleaned);

      if (!numberMatch) {
        return '_various';
      }

      // Get everything before the number
      let leftPart = cleaned.substring(0, numberMatch.index).trim();

      // Remove trailing separators
      leftPart = leftPart.replace(/[-_\s]+$/, '').trim();

      if (!leftPart) return '_various';

      // Process the group name
      return this.createGroupName(leftPart);

    } catch (error) {
      return '_various';
    }
  }

  private findLastNumber(text: string): { index: number, number: string } | null {
    const matches: { index: number, number: string }[] = [];

    // Find Arabic numbers
    const arabicRegex = /\d+/g;
    let match: RegExpExecArray | null;
    while ((match = arabicRegex.exec(text)) !== null) {
      matches.push({index: match.index, number: match[0]});
    }

    // Find Roman numerals (require at least one Roman letter) using word boundaries
    // Simpler and safe regex that cannot match empty strings
    const romanRegex = /\b[MDCLXVI]+\b/gi;
    while ((match = romanRegex.exec(text)) !== null) {
      // Safety: guard against zero-length matches to avoid infinite loops in some engines
      if (!match[0]) {
        romanRegex.lastIndex++;
        continue;
      }
      matches.push({index: match.index, number: match[0]});
    }

    if (matches.length === 0) return null;
    // Return the rightmost match by index
    let rightmost = matches[0];
    for (let i = 1; i < matches.length; i++) {
      if (matches[i].index >= rightmost.index) {
        rightmost = matches[i];
      }
    }
    return rightmost;
  }


  private createGroupName(leftPart: string): string {
    // Replace underscores with spaces
    let processed = leftPart.replace(/_/g, ' ').trim();

    // Split only on dash separators that have spaces around them (" - ")
    const parts = processed.split(/\s+-\s+/).map(p => p.trim()).filter(p => p.length > 0);

    if (parts.length > 1) {
      // If the last segment is a single word (e.g., "Band" or "Volume") adjacent to the number, drop it
      if (parts[parts.length - 1].split(/\s+/).length === 1) {
        parts.pop();
      }
      return parts.join('/');
    }

    // No dash-separated sections: return the processed title as-is
    return processed;
  }

}
