import { TestBed } from '@angular/core/testing';

import { ModalDataService } from './modal-data.service';

describe('ModalDataService', () => {
  let service: ModalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
