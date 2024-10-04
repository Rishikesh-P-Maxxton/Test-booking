import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArrivalDepartureService } from '../services/arrival-departure.service';
import { Subscription } from 'rxjs';
import { Stay } from '../Interfaces/stay';
import { RoomDepartureMap } from '../Interfaces/roomdeparturemap';



@Component({
  selector: 'app-arrival-departure-dashboard',
  templateUrl: './arrival-departure-dashboard.component.html',
  styleUrls: ['./arrival-departure-dashboard.component.css']
})
export class ArrivalDepartureDashboardComponent implements OnInit, OnDestroy {
  today: Date = new Date();
  roomDepartureMap: RoomDepartureMap | null = null;
  private subscription: Subscription = new Subscription();

  constructor(private arrivalDepartureService: ArrivalDepartureService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.arrivalDepartureService.roomDepartureMap$.subscribe(map => {
        this.roomDepartureMap = map;
        console.log('Dashboard received Room Departure Map:', this.roomDepartureMap);
      })
    );
  }

  getRoomIds(): string[] {
    return this.roomDepartureMap ? Object.keys(this.roomDepartureMap) : [];
  }

  getArrivalDates(roomId: string): string[] {
    const numericRoomId = Number(roomId);
    return this.roomDepartureMap && this.roomDepartureMap[numericRoomId]
      ? Object.keys(this.roomDepartureMap[numericRoomId])
      : [];
  }

  getDepartureDates(roomId: string, arrivalDate: string): string[] {
    const numericRoomId = Number(roomId);
    return this.roomDepartureMap &&
      this.roomDepartureMap[numericRoomId] &&
      this.roomDepartureMap[numericRoomId][arrivalDate]
      ? Object.keys(this.roomDepartureMap[numericRoomId][arrivalDate])
      : [];
  }

  getStay(roomId: string, arrivalDate: string): Stay | null {
    const numericRoomId = Number(roomId);
    const departures = this.roomDepartureMap?.[numericRoomId]?.[arrivalDate];
    if (departures) {
      const firstDepartureKey = Object.keys(departures)[0];
      return departures[firstDepartureKey];
    }
    return null;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
