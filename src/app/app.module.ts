import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { RoomsFilterComponent } from './rooms-filter/rooms-filter.component';
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import {MatStepperModule} from '@angular/material/stepper';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {MatSelectModule} from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';

import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatListModule} from '@angular/material/list';



import {MatButtonModule} from '@angular/material/button';


import { ReservationsListComponent } from './reservations-list/reservations-list.component';
import { FilterNavsComponent } from './filter-navs/filter-navs.component';
import { RoomAvailabilityGanttComponent } from './room-availability-gantt/room-availability-gantt.component';
import { NgxPaginationModule } from 'ngx-pagination';
import {MatDialogModule} from '@angular/material/dialog';

import { ModalComponent } from './modal/modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BookingHistoryComponent } from './booking-history/booking-history.component';
import { ResNavComponent } from './res-nav/res-nav.component';

import { RoomFilterButtonComponent } from './room-filter-button/room-filter-button.component';
import { NewRoomsFilterComponent } from './new-rooms-filter/new-rooms-filter.component';
import { DualCalendarComponent } from './dual-calendar/dual-calendar.component';
import { MainpageComponent } from './mainpage/mainpage.component';
import { NewPlanningChartComponent } from './new-planning-chart/new-planning-chart.component';
import { ArrivalDepartureDashboardComponent } from './arrival-departure-dashboard/arrival-departure-dashboard.component';
import { ChartModalComponent } from './chart-modal/chart-modal.component';
@NgModule({

declarations: [AppComponent, RoomsFilterComponent,  ReservationsListComponent, FilterNavsComponent, RoomAvailabilityGanttComponent,   ModalComponent, BookingHistoryComponent, ResNavComponent, RoomFilterButtonComponent, NewRoomsFilterComponent, DualCalendarComponent, MainpageComponent, NewPlanningChartComponent, ArrivalDepartureDashboardComponent, ChartModalComponent  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,  
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule, MatStepperModule,MatButtonModule,MatNativeDateModule,MatSelectModule,
    MatCardModule, MatTableModule, MatListModule, MatDialogModule,   NgxPaginationModule, MatTooltipModule 
    
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideNativeDateAdapter(), provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
