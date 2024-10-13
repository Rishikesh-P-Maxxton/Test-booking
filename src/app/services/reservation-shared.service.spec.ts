import { TestBed } from '@angular/core/testing';

import { ReservationSharedService } from './reservation-shared.service';

describe('ReservationSharedService', () => {
  let service: ReservationSharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservationSharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
