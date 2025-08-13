import {TestBed} from '@angular/core/testing';
import {EbookGroupingService} from "./ebook-grouping.service";

describe('ComicFileService', () => {
  let service: EbookGroupingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EbookGroupingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('groupFiles', () => {
    it('should return empty object for empty input', () => {
      const result = service.groupFiles([]);
      expect(result).toEqual({});
    });

    it('should group files according to the specified examples', () => {
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
      ];

      const result = service.groupFiles(input);

      // Debug output to understand what's happening
      console.log('DEBUG: Actual result:', JSON.stringify(result, null, 2));
      console.log('DEBUG: Result keys:', Object.keys(result));

      expect(result["Homunculus/New Edition"]).toEqual([
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_08_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_09_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz",
        "/Users/userabc/Filme.nosync/comics4/Homunculus_-_New_Edition_-_10_-_(Egmont)_-_GER_-_Hideo_Yamamoto.cbz"
      ]);

      expect(result["Nomad"]).toEqual([
        "/Users/userabc/Filme.nosync/comics4/Nomad_001_-_Lebendige_Erinnerung_(1995)_(Kult)_(c2c)_(danyberg).cbr",
        "/Users/userabc/Filme.nosync/comics4/Nomad_002_-_Gai-Jin_(1995)_(Kult)_(c2c)_(danyberg).cbr"
      ]);

      expect(result["Francois Schuiten/Jenseits der Grenze"]).toEqual([
        "/Users/userabc/Filme.nosync/comics4/Francois Schuiten - Jenseits der Grenze - Band 1.cbr",
        "/Users/userabc/Filme.nosync/comics4/Francois_Schuiten_-_Jenseits_der_Grenze_-_Band_2.cbr"
      ]);

      expect(result["Mickyvision II Serie 1967"]).toEqual([
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 01.cbr",
        "/Users/userabc/Comics.nosync/Mickyvision/Mickyvision II Serie 1967 02.cbr"
      ]);

      // Verify no other groups exist
      expect(Object.keys(result)).toHaveLength(4);
    });

    it('should handle files with no running numbers', () => {
      const input = [
        "/Users/test/comics/Some Random Comic File.cbr",
        "/Users/test/comics/Another Comic Without Numbers.cbz"
      ];

      const result = service.groupFiles(input);

      expect(result["_various"]).toEqual([
        "/Users/test/comics/Some Random Comic File.cbr",
        "/Users/test/comics/Another Comic Without Numbers.cbz"
      ]);
    });

    it('should handle Roman numerals as running numbers', () => {
      const input = [
        "/Users/test/comics/Batman Adventures I.cbr",
        "/Users/test/comics/Batman Adventures II.cbr",
        "/Users/test/comics/Batman Adventures III.cbr"
      ];

      const result = service.groupFiles(input);

      expect(result["Batman Adventures"]).toEqual([
        "/Users/test/comics/Batman Adventures I.cbr",
        "/Users/test/comics/Batman Adventures II.cbr",
        "/Users/test/comics/Batman Adventures III.cbr"
      ]);
    });

    it('should ignore content in brackets and parentheses', () => {
      const input = [
        "/Users/test/comics/Superman [DC] (2020) 01.cbr",
        "/Users/test/comics/Superman [DC] (2020) 02.cbr"
      ];

      const result = service.groupFiles(input);

      expect(result["Superman"]).toEqual([
        "/Users/test/comics/Superman [DC] (2020) 01.cbr",
        "/Users/test/comics/Superman [DC] (2020) 02.cbr"
      ]);
    });

    it('should handle dash-separated titles correctly', () => {
      const input = [
        "/Users/test/comics/Spider-Man - Ultimate Collection - Volume 1.cbr",
        "/Users/test/comics/Spider-Man - Ultimate Collection - Volume 2.cbr"
      ];

      const result = service.groupFiles(input);

      expect(result["Spider-Man/Ultimate Collection"]).toEqual([
        "/Users/test/comics/Spider-Man - Ultimate Collection - Volume 1.cbr",
        "/Users/test/comics/Spider-Man - Ultimate Collection - Volume 2.cbr"
      ]);
    });

    it('should ...', () => {
      const input = [
        "/Users/test/comics/Amazing X-Men II Special Edition 2023 01.cbr",
        "/Users/test/comics/Amazing X-Men II Special Edition 2023 02.cbr"
      ];

      const result = service.groupFiles(input);

      expect(result["Amazing X-Men II Special Edition 2023"]).toEqual([
        "/Users/test/comics/Amazing X-Men II Special Edition 2023 01.cbr",
        "/Users/test/comics/Amazing X-Men II Special Edition 2023 02.cbr"
      ]);
    });

    it('should .....', () => {
      const input = [
        "/Users/test/comics/Justice League 2020 Annual 01.cbr",
        "/Users/test/comics/Justice League 2020 Annual 02.cbr"
      ];

      const result = service.groupFiles(input);

      expect(result["Justice League 2020 Annual"]).toEqual([
        "/Users/test/comics/Justice League 2020 Annual 01.cbr",
        "/Users/test/comics/Justice League 2020 Annual 02.cbr"
      ]);
    });

    it('should handle single files correctly', () => {
      const input = [
        "/Users/test/comics/Wonder Woman - Annual Special 01.cbr"
      ];

      const result = service.groupFiles(input);

      expect(result["Wonder Woman/Annual Special"]).toEqual([
        "/Users/test/comics/Wonder Woman - Annual Special 01.cbr"
      ]);
    });
  });
});