import {TestBed} from '@angular/core/testing';
import {ComicFileService} from "./comic-file.service";

describe('ComicFileService', () => {
  let service: ComicFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComicFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});