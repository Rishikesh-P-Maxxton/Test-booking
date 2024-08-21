import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomsFilterComponent } from './rooms-filter/rooms-filter.component';
import { RoomAvailabilityChartComponent } from './room-availability-chart/room-availability-chart.component';
import { SteppersComponent } from './Tests/steppers/steppers.component';
import { FilterNavsComponent } from './filter-navs/filter-navs.component';
import { ReservationsListComponent } from './reservations-list/reservations-list.component';

const routes: Routes = [
  { path: 'filter', component: RoomsFilterComponent },
  { path: 'filterroom', component: FilterNavsComponent,
    children:[
      { path: '', redirectTo: 'allrooms', pathMatch: 'full', outlet: 'filternav' },
      {path: 'allrooms', component:RoomsFilterComponent, outlet:'filternav'},
      {path: 'reslist', component:ReservationsListComponent, outlet:'filternav'}

    ]
   },
  { path: 'graph', component: RoomAvailabilityChartComponent },
  {path: 'test', component: SteppersComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
