import { TestBed } from '@angular/core/testing';
import { GeolocsService } from './geolocs.service';



describe('GeolocsService', () => {
  let service: GeolocsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeolocsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
