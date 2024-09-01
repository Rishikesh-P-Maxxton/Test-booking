import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomsFilterComponent } from './rooms-filter/rooms-filter.component';


import { FilterNavsComponent } from './filter-navs/filter-navs.component';
import { ReservationsListComponent } from './reservations-list/reservations-list.component';
import { RoomAvailabilityGanttComponent } from './room-availability-gantt/room-availability-gantt.component';


const routes: Routes = [
  { path: 'filter', component: RoomsFilterComponent },
  { path: 'planner', component: RoomAvailabilityGanttComponent },
  { path: 'filterroom', component: FilterNavsComponent,
    children:[
      { path: '', redirectTo: 'allrooms', pathMatch: 'full', outlet: 'filternav' },
      {path: 'allrooms', component:RoomsFilterComponent, outlet:'filternav'},
      {path: 'reslist', component:ReservationsListComponent, outlet:'filternav'},
      {path: 'planner', component:RoomAvailabilityGanttComponent, outlet:'filternav'}

    ]
   },
  { path: 'reslist', component: ReservationsListComponent},


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
