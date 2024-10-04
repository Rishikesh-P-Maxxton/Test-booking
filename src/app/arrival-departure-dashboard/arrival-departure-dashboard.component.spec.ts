import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrivalDepartureDashboardComponent } from './arrival-departure-dashboard.component';

describe('ArrivalDepartureDashboardComponent', () => {
  let component: ArrivalDepartureDashboardComponent;
  let fixture: ComponentFixture<ArrivalDepartureDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArrivalDepartureDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArrivalDepartureDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
