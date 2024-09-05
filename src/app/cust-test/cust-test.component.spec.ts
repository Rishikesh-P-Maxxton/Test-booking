import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustTestComponent } from './cust-test.component';

describe('CustTestComponent', () => {
  let component: CustTestComponent;
  let fixture: ComponentFixture<CustTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
