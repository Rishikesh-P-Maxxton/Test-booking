import { TestBed } from '@angular/core/testing';

import { FilterStateServiceService } from './filter-state-service.service';

describe('FilterStateServiceService', () => {
  let service: FilterStateServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterStateServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
