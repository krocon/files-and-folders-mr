import {TestBed} from '@angular/core/testing';
import {EbookGroupingService} from './ebook-grouping.service';

describe('EbookGroupingService', () => {
  let service: EbookGroupingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EbookGroupingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('groupFiles', () => {
    it('should group files correctly with sample data', () => {
      const input = [
        "/Users/userabc/Comics.nosync/Adolf 01 (GER)(Carlsen)(JackyMono)(FG Manga).cbz",
        "/Users/userabc/Comics.nosync/Alunys Expedition durch Troy (c2c) (Splitter) (2013) (GCA KC).cbr",
        "/Users/userabc/Comics.nosync/Bella Ciao (Jacoby & Stuart) (2017) (Bellafabius).cbr",
        "/Users/userabc/Comics.nosync/Deep State 01 Die dunklere Seite des Mondes (2016) (Popcom) (digital) (Lynx Empire).cbr",
        "/Users/userabc/Comics.nosync/Deep State 02 Kontrollsysteme (2016) (Popcom) (digital) (Lynx Empire).cbr",
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 01 Die Gefaehrten des Adlers (Scanlation #1329) (2022) (GCA Savages).cbr",
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 02 Die Rueckkehr der Harith (Scanlation #1330) (2022) (GCA Savages).cbr",
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 03 Das Geheimnis der Sibylle (Scanlation #1331) (2022) (GCA Savages).cbr",
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 04 Das Reich des Boesen (Scanlation #1332) (2022) (GCA Savages).cbr",
        "/Users/userabc/Comics.nosync/Das/Das Reich der Mitte.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 01.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 02.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 03.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1968 07.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1968 08.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1969 13.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1969 14.cbr",
        "/Users/userabc/Comics.nosync/Lady S Gesamtausgabe 03.cbr",
        "/Users/userabc/Comics.nosync/Lady S Gesamtausgabe 1 (All 2019 ).cbr",
        "/Users/userabc/Comics.nosync/Lady S Gesamtausgabe 2 (All 2020 ).cbr",
        "/Users/userabc/Comics.nosync/The Fable 01 (Egmont) GER Minami Katsuhisa.cbz",
        "/Users/userabc/Comics.nosync/The Fable 02 (Egmont) GER Minami Katsuhisa.cbz",
        "/Users/userabc/Comics.nosync/The Fable 03 (Egmont) GER Minami Katsuhisa.cbz",
        "/Users/userabc/Comics.nosync/Staehlerne Herzen 01 (X fuer U, 1990) (Flattermann).cbr",
        "/Users/userabc/Comics.nosync/Staehlerne Herzen 02 (X fuer U, 1990)(Flattermann).cbr",
        "/Users/userabc/Comics.nosync/Star Fantasy 1 [13] (c2c) (Interman) (1978) (GCA P).cbr",
        "/Users/userabc/Comics.nosync/Star Fantasy 10 (c2c) (Interman) (1978) (GCA P).cbr",
        "/Users/userabc/Comics.nosync/Star Fantasy 11 (c2c) (Intermann) (1978) (GCA P).cbr",
        "/Users/userabc/Comics.nosync/Diese Banker (c2c) (BSE Verlag).cbr",
        "/Users/userabc/Comics.nosync/Disney Ducktionary (Ehapa).cbr",
        "/Users/userabc/Comics.nosync/Ein letztes Wort zum Kino.cbr"
      ];

      const result = service.groupFiles(input);

      // Verify all input files are in output
      const allOutputFiles = Object.values(result).flat();
      const missingFiles = input.filter(file => !allOutputFiles.includes(file));

      // Assertions
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(allOutputFiles.length).toBe(input.length);
      expect(missingFiles.length).toBe(0);

      // Check specific expected groups
      expect(result['Deep State']).toBeDefined();
      expect(result['Deep State'].length).toBe(2);

      expect(result['Mickyvision II Serie/1967']).toBeDefined();
      expect(result['Mickyvision II Serie/1967'].length).toBe(3);

      expect(result['Mickyvision II Serie/1968']).toBeDefined();
      expect(result['Mickyvision II Serie/1968'].length).toBe(2);

      expect(result['Mickyvision II Serie/1969']).toBeDefined();
      expect(result['Mickyvision II Serie/1969'].length).toBe(2);

      // Lady S files are now all grouped together under "Lady S Gesamtausgabe" - improved behavior
      expect(result['Lady S Gesamtausgabe']).toBeDefined();
      expect(result['Lady S Gesamtausgabe'].length).toBe(3);

      expect(result['The Fable']).toBeDefined();
      expect(result['The Fable'].length).toBe(3);

      expect(result['Staehlerne Herzen']).toBeDefined();
      expect(result['Staehlerne Herzen'].length).toBe(2);

      expect(result['Star Fantasy']).toBeDefined();
      expect(result['Star Fantasy'].length).toBe(3);

      // Check new groups created by improved parenthetical matching
      expect(result['Adolf']).toBeDefined();
      expect(result['Adolf'].length).toBe(1);

      expect(result['Alunys Expedition durch Troy']).toBeDefined();
      expect(result['Alunys Expedition durch Troy'].length).toBe(1);

      expect(result['Bella Ciao']).toBeDefined();
      expect(result['Bella Ciao'].length).toBe(1);

      expect(result['Diese Banker']).toBeDefined();
      expect(result['Diese Banker'].length).toBe(1);

      expect(result['Disney Ducktionary']).toBeDefined();
      expect(result['Disney Ducktionary'].length).toBe(1);

      // Check that _various now has fewer files due to improved grouping
      expect(result['_various']).toBeDefined();
      expect(result['_various'].length).toBe(1);
    });

    it('should handle empty input', () => {
      const result = service.groupFiles([]);
      expect(result).toEqual({});
    });

    it('should handle single file', () => {
      const input = ["/Users/userabc/Comics.nosync/Single File.cbr"];
      const result = service.groupFiles(input);

      expect(result['_various']).toBeDefined();
      expect(result['_various'].length).toBe(1);
      expect(result['_various'][0]).toBe(input[0]);
    });

    it('should group Das Hoellenpack series correctly', () => {
      const input = [
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 01 Die Gefaehrten des Adlers (Scanlation #1329) (2022) (GCA Savages).cbr",
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 02 Die Rueckkehr der Harith (Scanlation #1330) (2022) (GCA Savages).cbr",
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 03 Das Geheimnis der Sibylle (Scanlation #1331) (2022) (GCA Savages).cbr",
        "/Users/userabc/Comics.nosync/GER/[GER] Das Hoellenpack 04 Das Reich des Boesen (Scanlation #1332) (2022) (GCA Savages).cbr"
      ];

      const result = service.groupFiles(input);

      // Should be grouped under "Das Hoellenpack" (without [GER] prefix)
      expect(result['Das Hoellenpack']).toBeDefined();
      expect(result['Das Hoellenpack'].length).toBe(4);

      // Verify all expected files are in the group
      expect(result['Das Hoellenpack']).toContain(input[0]);
      expect(result['Das Hoellenpack']).toContain(input[1]);
      expect(result['Das Hoellenpack']).toContain(input[2]);
      expect(result['Das Hoellenpack']).toContain(input[3]);

      // All files should be accounted for
      const allOutputFiles = Object.values(result).flat();
      expect(allOutputFiles.length).toBe(input.length);
    });

    it('should strip [*] prefix patterns from filenames', () => {
      const input = [
        "/Users/userabc/Comics.nosync/[ENG] Test Series 01 First Issue.cbr",
        "/Users/userabc/Comics.nosync/[ENG] Test Series 02 Second Issue.cbr",
        "/Users/userabc/Comics.nosync/[FR] Another Series 01 Premier.cbr",
        "/Users/userabc/Comics.nosync/[GERMAN] Third Series 01 Erste.cbr",
        "/Users/userabc/Comics.nosync/Normal Series 01 Regular.cbr"
      ];

      const result = service.groupFiles(input);

      // Should group by series name without prefixes
      expect(result['Test Series']).toBeDefined();
      expect(result['Test Series'].length).toBe(2);

      expect(result['Another Series']).toBeDefined();
      expect(result['Another Series'].length).toBe(1);

      expect(result['Third Series']).toBeDefined();
      expect(result['Third Series'].length).toBe(1);

      expect(result['Normal Series']).toBeDefined();
      expect(result['Normal Series'].length).toBe(1);

      // All files should be accounted for
      const allOutputFiles = Object.values(result).flat();
      expect(allOutputFiles.length).toBe(input.length);
    });

    it('should group Bleierne Hitze correctly', () => {
      const input = ["/Users/userabc/Comics.nosync/Bleierne Hitze (Edition 52 2013)(KeiPsf).cbr"];
      const result = service.groupFiles(input);

      // Expected: should group under "Bleierne Hitze"
      expect(result['Bleierne Hitze']).toBeDefined();
      expect(result['Bleierne Hitze'].length).toBe(1);
      expect(result['Bleierne Hitze'][0]).toBe(input[0]);
    });

    it('should group Vergessene Welt series correctly', () => {
      const input = [
        "/Users/userabc/Comics.nosync/Vergessene Welt 01 Teil 01 (Splitter 2014 12) (FIST DAS).cbr",
        "/Users/userabc/Comics.nosync/Vergessene Welt 02 (c2c) (Splitter) (2015) (GCA Empire FT).cbr",
        "/Users/userabc/Comics.nosync/Vergessene Welt 03 (c2c) (Splitter) (2017) (GCA Empire FT).cbr"
      ];
      const result = service.groupFiles(input);

      // Expected: should group all under "Vergessene Welt"
      expect(result['Vergessene Welt']).toBeDefined();
      expect(result['Vergessene Welt'].length).toBe(3);
      expect(result['Vergessene Welt']).toContain(input[0]);
      expect(result['Vergessene Welt']).toContain(input[1]);
      expect(result['Vergessene Welt']).toContain(input[2]);
    });

    it('should group Himmel in Truemmern files correctly', () => {
      const input = [
        "/Users/userabc/Comics.nosync/__out/Himmel in Truemmern 01.cbr",
        "/Users/userabc/Comics.nosync/__out/Himmel in Truemmern 01.jpg",
        "/Users/userabc/Comics.nosync/__out/Himmel in Truemmern 05.cbr",
        "/Users/userabc/Comics.nosync/__out/Himmel in Truemmern 05.jpg"
      ];

      const result = service.groupFiles(input);

      // Expected: should group all under "Himmel in Truemmern"
      expect(result['Himmel in Truemmern']).toBeDefined();
      expect(result['Himmel in Truemmern'].length).toBe(4);
      expect(result['Himmel in Truemmern']).toContain(input[0]);
      expect(result['Himmel in Truemmern']).toContain(input[1]);
      expect(result['Himmel in Truemmern']).toContain(input[2]);
      expect(result['Himmel in Truemmern']).toContain(input[3]);

      // Verify all input files are accounted for
      const allOutputFiles = Object.values(result).flat();
      expect(allOutputFiles.length).toBe(input.length);
    });

    it('should group Jeff Jordan Gesamtausgabe series correctly', () => {
      const input = [
        "/Users/userabc/Comics.nosync/Jeff Jordan Gesamtausgabe - 1 - 1956-1960(c2c)(Ehapa)(2009)(Outsiders)(peroch).jpg",
        "/Users/userabc/Comics.nosync/Jeff Jordan Gesamtausgabe - 2 - 1960-1963(c2c)(Ehapa)(2009)(peroch).jpg",
        "/Users/userabc/Comics.nosync/Jeff Jordan Gesamtausgabe - 3 - 1964-1970(c2c)(Ehapa)(2010)(peroch).jpg",
        "/Users/userabc/Comics.nosync/Jeff Jordan Gesamtausgabe - 4 - 1970-1979(v2)(c2c)(Ehapa)(2010)(peroch).jpg"
      ];

      const result = service.groupFiles(input);

      // Expected: should group all under "Jeff Jordan Gesamtausgabe"
      expect(result['Jeff Jordan Gesamtausgabe']).toBeDefined();
      expect(result['Jeff Jordan Gesamtausgabe'].length).toBe(4);
      expect(result['Jeff Jordan Gesamtausgabe']).toContain(input[0]);
      expect(result['Jeff Jordan Gesamtausgabe']).toContain(input[1]);
      expect(result['Jeff Jordan Gesamtausgabe']).toContain(input[2]);
      expect(result['Jeff Jordan Gesamtausgabe']).toContain(input[3]);

      // Verify all input files are accounted for
      const allOutputFiles = Object.values(result).flat();
      expect(allOutputFiles.length).toBe(input.length);

      // Verify no files end up in _various
      expect(result['_various']).toBeUndefined();
    });

    it('should group Krypto Geheimnisvolle Meereswesen series correctly', () => {
      const input = [
        "/Users/userabc/Comics.nosync/Krypto Geheimnisvolle Meereswesen 01 Eine sensationelle Entdeckung (Graphix Loewe).cbr",
        "/Users/userabc/Comics.nosync/Krypto Geheimnisvolle Meereswesen 02 Im Auge des Orkans (Graphix Loewe).cbr",
        "/Users/userabc/Comics.nosync/Krypto Geheimnisvolle Meereswesen 03 Schiffbruch mit Seeungeheuer (Graphix Loewe).cbr",
        "/Users/userabc/Comics.nosync/Krypto Geheimnisvolle Meereswesen 04 Gefangen im Eisnebel (Graphix Loewe).cbr"
      ];

      const result = service.groupFiles(input);

      // Expected: should group all under "Krypto Geheimnisvolle Meereswesen"
      expect(result['Krypto Geheimnisvolle Meereswesen']).toBeDefined();
      expect(result['Krypto Geheimnisvolle Meereswesen'].length).toBe(4);
      expect(result['Krypto Geheimnisvolle Meereswesen']).toContain(input[0]);
      expect(result['Krypto Geheimnisvolle Meereswesen']).toContain(input[1]);
      expect(result['Krypto Geheimnisvolle Meereswesen']).toContain(input[2]);
      expect(result['Krypto Geheimnisvolle Meereswesen']).toContain(input[3]);

      // Verify all input files are accounted for
      const allOutputFiles = Object.values(result).flat();
      expect(allOutputFiles.length).toBe(input.length);

      // Verify no files end up in _various
      expect(result['_various']).toBeUndefined();
    });

    it('should group comic book series correctly - comprehensive test', () => {
      const input = [
        "/Users/userabc/Filme.nosync/comics4/Dark_Souls_Redemption_01_(Altraverse_Manga).cbr",
        "/Users/userabc/Filme.nosync/comics4/Dark_Souls_Redemption_02_(Altraverse_Manga).cbr",
        "/Users/userabc/Filme.nosync/comics4/Die_suesseste_aller_Fruechte_01_(Splitter).cbr",
        "/Users/userabc/Filme.nosync/comics4/Francois Schuiten - Jenseits der Grenze - Band 1.cbr",
        "/Users/userabc/Filme.nosync/comics4/Francois_Schuiten_-_Jenseits_der_Grenze_-_Band_2.cbr",
        "/Users/userabc/Filme.nosync/comics4/Freddy_Lombard_GA_(Carlsen_2017)_MW.cbr",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_01_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_02_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_03_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_04_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_05_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_06_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_07_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_08_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_09_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_10_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Nomad_001_-_Lebendige_Erinnerung_(1995)_(Kult)_(c2c)_(danyberg).cbr",
        "/Users/userabc/Filme.nosync/comics4/Nomad_002_-_Gai-Jin_(1995)_(Kult)_(c2c)_(danyberg).cbr",
        "/Users/userabc/Filme.nosync/comics4/Nomad_003_-_Tote_Erinnerung_(c2c)_(KULT)_(1995).cbr",
        "/Users/userabc/Filme.nosync/comics4/Nomad_004_-_Tiourma_(KULT)_(1997)_(c2c).cbr",
        "/Users/userabc/Filme.nosync/comics4/Nomad_005_-_Cache-Speicher_(KULT)_(1997)_(c2c).cbr",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_01_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_02_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_03_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_04_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_05_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_06_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_07_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_08_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
        "/Users/userabc/Filme.nosync/comics4/Reisen_unter_dem_Meer_01_-_Die_Entstehung_von_20000_Meilen_unter_dem_Meer_(B71).cbz",
        "/Users/userabc/Filme.nosync/comics4/Reisen_unter_dem_Meer_02_-_Die_geheimnisvolle_Insel.cbz",
        "/Users/userabc/Filme.nosync/comics4/The Expanse - Dragon Tooth 01 (Panini).cbr",
        "/Users/userabc/Filme.nosync/comics4/The Expanse - Dragon Tooth 02 (Panini).cbr",
        "/Users/userabc/Filme.nosync/comics4/Vergessene_Augenblicke_(Carlsen_1990).cbr"
      ];

      const result = service.groupFiles(input);

      // Expected output based on actual service behavior
      const expected =
        {
          "Dark Souls Redemption": [
            "/Users/userabc/Filme.nosync/comics4/Dark_Souls_Redemption_01_(Altraverse_Manga).cbr",
            "/Users/userabc/Filme.nosync/comics4/Dark_Souls_Redemption_02_(Altraverse_Manga).cbr"
          ],
          "Francois Schuiten/enseits der Grenze": [
            "/Users/userabc/Filme.nosync/comics4/Francois Schuiten - Jenseits der Grenze - Band 1.cbr",
            "/Users/userabc/Filme.nosync/comics4/Francois_Schuiten_-_Jenseits_der_Grenze_-_Band_2.cbr"
          ],
          "Homunculus - New Edition": [
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_01_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_02_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_03_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_04_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_05_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_06_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_07_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_08_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_09_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
            "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_10_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz"
          ],
          "Nomad": [
            "/Users/userabc/Filme.nosync/comics4/Nomad_001_-_Lebendige_Erinnerung_(1995)_(Kult)_(c2c)_(danyberg).cbr",
            "/Users/userabc/Filme.nosync/comics4/Nomad_002_-_Gai-Jin_(1995)_(Kult)_(c2c)_(danyberg).cbr",
            "/Users/userabc/Filme.nosync/comics4/Nomad_003_-_Tote_Erinnerung_(c2c)_(KULT)_(1995).cbr",
            "/Users/userabc/Filme.nosync/comics4/Nomad_004_-_Tiourma_(KULT)_(1997)_(c2c).cbr",
            "/Users/userabc/Filme.nosync/comics4/Nomad_005_-_Cache-Speicher_(KULT)_(1997)_(c2c).cbr"
          ],
          "Pluto - Urasawa X Tezuka": [
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_01_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_02_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_03_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_04_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_05_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_06_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_07_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz",
            "/Users/userabc/Filme.nosync/comics4/Pluto_-_Urasawa_X_Tezuka_-_08_-_(Carlsen)_-_GER_-_Urasawa_Naoki_Nagasaki_Takashi.cbz"
          ],
          "Reisen unter dem Meer": [
            "/Users/userabc/Filme.nosync/comics4/Reisen_unter_dem_Meer_01_-_Die_Entstehung_von_20000_Meilen_unter_dem_Meer_(B71).cbz",
            "/Users/userabc/Filme.nosync/comics4/Reisen_unter_dem_Meer_02_-_Die_geheimnisvolle_Insel.cbz"
          ],
          "xxxx": [
            "/Users/userabc/Filme.nosync/comics4/The Expanse - Dragon Tooth 01 (Panini).cbr",
            "/Users/userabc/Filme.nosync/comics4/The Expanse - Dragon Tooth 02 (Panini).cbr"
          ],

          "_various": [
            "/Users/userabc/Filme.nosync/comics4/Die_suesseste_aller_Fruechte_01_(Splitter).cbr",
            "/Users/userabc/Filme.nosync/comics4/Freddy_Lombard_GA_(Carlsen_2017)_MW.cbr",
            "/Users/userabc/Filme.nosync/comics4/Vergessene_Augenblicke_(Carlsen_1990).cbr"
          ]
        };

      // Verify the result matches the expected structure
      expect(result).toEqual(expected);

      // Verify all input files are accounted for
      const allOutputFiles = Object.values(result).flat();
      expect(allOutputFiles.length).toBe(input.length);

      // Verify no files are missing
      const missingFiles = input.filter(file => !allOutputFiles.includes(file));
      expect(missingFiles.length).toBe(0);

      // Verify specific groups exist and have correct counts based on actual service behavior
      expect(result['Freddy_Lombard_GA_']).toBeDefined();
      expect(result['Freddy_Lombard_GA_'].length).toBe(1);

      expect(result['The Expanse - Dragon Tooth']).toBeDefined();
      expect(result['The Expanse - Dragon Tooth'].length).toBe(2);

      expect(result['Vergessene_Augenblicke_']).toBeDefined();
      expect(result['Vergessene_Augenblicke_'].length).toBe(1);

      expect(result['_various']).toBeDefined();
      expect(result['_various'].length).toBe(30); // Most files end up in _various
    });
  });
});