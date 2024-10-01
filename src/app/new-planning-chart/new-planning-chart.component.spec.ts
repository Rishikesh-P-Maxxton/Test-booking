import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPlanningChartComponent } from './new-planning-chart.component';

describe('NewPlanningChartComponent', () => {
  let component: NewPlanningChartComponent;
  let fixture: ComponentFixture<NewPlanningChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewPlanningChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPlanningChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
