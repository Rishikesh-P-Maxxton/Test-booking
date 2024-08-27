import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomShowcaseComponent } from './room-showcase.component';

describe('RoomShowcaseComponent', () => {
  let component: RoomShowcaseComponent;
  let fixture: ComponentFixture<RoomShowcaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomShowcaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomShowcaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
