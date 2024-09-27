import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomFilterButtonComponent } from './room-filter-button.component';

describe('RoomFilterButtonComponent', () => {
  let component: RoomFilterButtonComponent;
  let fixture: ComponentFixture<RoomFilterButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomFilterButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomFilterButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
