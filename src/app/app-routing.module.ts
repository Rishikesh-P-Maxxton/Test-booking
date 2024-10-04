import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomsFilterComponent } from './rooms-filter/rooms-filter.component';


import { FilterNavsComponent } from './filter-navs/filter-navs.component';
import { ReservationsListComponent } from './reservations-list/reservations-list.component';
import { RoomAvailabilityGanttComponent } from './room-availability-gantt/room-availability-gantt.component';
import { BookingHistoryComponent } from './booking-history/booking-history.component';
import { ResNavComponent } from './res-nav/res-nav.component';

import { NewRoomsFilterComponent } from './new-rooms-filter/new-rooms-filter.component';
import { MainpageComponent } from './mainpage/mainpage.component';
import { NewPlanningChartComponent } from './new-planning-chart/new-planning-chart.component';
import { ArrivalDepartureDashboardComponent } from './arrival-departure-dashboard/arrival-departure-dashboard.component';


const routes: Routes = [
  { path: '', redirectTo: 'reservations', pathMatch: 'full' },  
  { path: 'home', component: MainpageComponent }, 
  { path: 'newplanner', component: NewPlanningChartComponent},
  { path: 'filter', component: RoomsFilterComponent },
  { path: 'planner', component: RoomAvailabilityGanttComponent },
  { path: 'dev', component: ArrivalDepartureDashboardComponent },
  
  { path: 'matdia', component: NewRoomsFilterComponent },
  // { path: 'filterroom', component: FilterNavsComponent,
  //   children:[
  //     { path: '', redirectTo: 'allrooms', pathMatch: 'full', outlet: 'filternav' },
  //     {path: 'allrooms', component:RoomsFilterComponent, outlet:'filternav'},
  //     {path: 'reslist', component:ReservationsListComponent, outlet:'filternav'},
  //     {path: 'planner', component:RoomAvailabilityGanttComponent, outlet:'filternav'}

  //   ]
  //  },

   { path: 'reservations', component: ResNavComponent,
    children:[
      { path: '', redirectTo: 'allres', pathMatch: 'full', outlet: 'resnav' },
      {path: 'allres', component:ReservationsListComponent, outlet:'resnav'},
      {path: 'reshistory', component:BookingHistoryComponent, outlet:'resnav'},
     

    ]
   },
  

  

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
