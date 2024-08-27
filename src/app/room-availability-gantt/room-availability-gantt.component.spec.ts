import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomAvailabilityGanttComponent } from './room-availability-gantt.component';

describe('RoomAvailabilityGanttComponent', () => {
  let component: RoomAvailabilityGanttComponent;
  let fixture: ComponentFixture<RoomAvailabilityGanttComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomAvailabilityGanttComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomAvailabilityGanttComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
