import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomsFilterComponent } from './rooms-filter/rooms-filter.component';
import { RoomAvailabilityChartComponent } from './room-availability-chart/room-availability-chart.component';
import { SteppersComponent } from './Tests/steppers/steppers.component';

const routes: Routes = [
  { path: 'filter', component: RoomsFilterComponent },
  { path: 'graph', component: RoomAvailabilityChartComponent },
  {path: 'test', component: SteppersComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
