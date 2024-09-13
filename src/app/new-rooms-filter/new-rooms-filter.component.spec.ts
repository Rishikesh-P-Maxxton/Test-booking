import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRoomsFilterComponent } from './new-rooms-filter.component';

describe('NewRoomsFilterComponent', () => {
  let component: NewRoomsFilterComponent;
  let fixture: ComponentFixture<NewRoomsFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewRoomsFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewRoomsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
