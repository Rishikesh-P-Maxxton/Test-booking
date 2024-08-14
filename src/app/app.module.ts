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

import {MatSelectModule} from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';




import {MatButtonModule} from '@angular/material/button';
import { RoomShowcaseComponent } from './room-showcase/room-showcase.component';
@NgModule({
  declarations: [AppComponent, RoomsFilterComponent, RoomAvailabilityChartComponent, SteppersComponent, RoomShowcaseComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule, MatStepperModule,MatButtonModule,MatNativeDateModule,MatSelectModule
    
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideNativeDateAdapter(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
