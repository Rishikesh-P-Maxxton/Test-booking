import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomAvailabilityChartComponent } from './room-availability-chart.component';

describe('RoomAvailabilityChartComponent', () => {
  let component: RoomAvailabilityChartComponent;
  let fixture: ComponentFixture<RoomAvailabilityChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomAvailabilityChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomAvailabilityChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
