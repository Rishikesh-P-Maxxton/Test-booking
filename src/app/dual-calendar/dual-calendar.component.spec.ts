import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DualCalendarComponent } from './dual-calendar.component';

describe('DualCalendarComponent', () => {
  let component: DualCalendarComponent;
  let fixture: ComponentFixture<DualCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DualCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DualCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
