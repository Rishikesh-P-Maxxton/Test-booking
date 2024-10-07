import { TestBed } from '@angular/core/testing';

import { DualCalendarTriggerServiceService } from './dual-calendar-trigger-service.service';

describe('DualCalendarTriggerServiceService', () => {
  let service: DualCalendarTriggerServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DualCalendarTriggerServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
