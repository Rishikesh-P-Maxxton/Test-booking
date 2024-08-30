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
import { RoomAvailabilityChartComponent } from './room-availability-chart/room-availability-chart.component';
import { SteppersComponent } from './Tests/steppers/steppers.component';
import {MatStepperModule} from '@angular/material/stepper';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {MatSelectModule} from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';

import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatListModule} from '@angular/material/list';



import {MatButtonModule} from '@angular/material/button';
import { RoomShowcaseComponent } from './room-showcase/room-showcase.component';
import { GanttChartComponent } from './gantt-chart/gantt-chart.component';
import { ReservationsListComponent } from './reservations-list/reservations-list.component';
import { FilterNavsComponent } from './filter-navs/filter-navs.component';
import { RoomAvailabilityGanttComponent } from './room-availability-gantt/room-availability-gantt.component';
import { NgxPaginationModule } from 'ngx-pagination';
import {MatDialogModule} from '@angular/material/dialog';
import { BookingModalComponent } from './booking-modal/booking-modal.component';
import { ParentComponent } from './parent/parent.component';

@NgModule({
  declarations: [AppComponent, RoomsFilterComponent, RoomAvailabilityChartComponent, SteppersComponent, RoomShowcaseComponent, GanttChartComponent, ReservationsListComponent, FilterNavsComponent, RoomAvailabilityGanttComponent, BookingModalComponent, ParentComponent, ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,  
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule, MatStepperModule,MatButtonModule,MatNativeDateModule,MatSelectModule,
    MatCardModule, MatTableModule, MatListModule, MatDialogModule,   NgxPaginationModule, 
    
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideNativeDateAdapter(), provideAnimationsAsync()
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
