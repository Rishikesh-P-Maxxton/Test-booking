import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterNavsComponent } from './filter-navs.component';

describe('FilterNavsComponent', () => {
  let component: FilterNavsComponent;
  let fixture: ComponentFixture<FilterNavsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilterNavsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterNavsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
