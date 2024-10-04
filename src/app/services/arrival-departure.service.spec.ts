import { TestBed } from '@angular/core/testing';

import { ArrivalDepartureService } from './arrival-departure.service';

describe('ArrivalDepartureService', () => {
  let service: ArrivalDepartureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArrivalDepartureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
