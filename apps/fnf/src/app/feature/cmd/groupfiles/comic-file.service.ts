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
  "Mickyvision II/Serie/1967": [
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

     Aber 2: wenn ein gespittetes Wort nur 2 Zeichen hat ("II" in "Mickyvision II Serie 1967 01.cbr"), dann wird es mit dem Wort davor verbunden: "Mickyvision II"

2b) Wenn wir keine Running-Number gefunden haben, dann lautet die Gruppe "_various".

*/
@Injectable({
  providedIn: 'root'
})
export class ComicFileService {

  groupFiles(files: string[]): { [key: string]: string[] } {
    if (files.length === 0) return {};

    const groups: { [key: string]: string[] } = {};

    return groups;
  }
}
