import { TestBed } from '@angular/core/testing';

import { ReservationStorageService } from './reservation-storage.service';

describe('ReservationStorageService', () => {
  let service: ReservationStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservationStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
