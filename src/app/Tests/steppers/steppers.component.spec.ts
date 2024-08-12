import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SteppersComponent } from './steppers.component';

describe('SteppersComponent', () => {
  let component: SteppersComponent;
  let fixture: ComponentFixture<SteppersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SteppersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SteppersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
