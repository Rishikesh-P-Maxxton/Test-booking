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
    // Subscribe to the optimized room departure map
    this.subscription.add(
      this.arrivalDepartureService.getOptimizedRoomDepartureMap().subscribe(
        (optimizedMap) => {
          if (optimizedMap) {
            this.roomDepartureMap = optimizedMap;
            console.log('Optimized Room Departure Map:', this.roomDepartureMap);
          } else {
            console.log('No optimized map available.');
          }
        },
        (error) => {
          console.error('Error fetching optimized map:', error);
        }
      )
    );
  }

  getRoomIds(): string[] {
    // Use nullish coalescing to ensure an empty array if roomDepartureMap is null
    return this.roomDepartureMap ? Object.keys(this.roomDepartureMap) : [];
  }

  getArrivalDates(roomId: string): string[] {
    // Ensure that roomDepartureMap is not null before accessing properties
    const numericRoomId = Number(roomId);
    return this.roomDepartureMap?.[numericRoomId]
      ? Object.keys(this.roomDepartureMap[numericRoomId])
      : [];
  }

  getDepartureDates(roomId: string, arrivalDate: string): string[] {
    // Use optional chaining to safely access properties if they exist
    const numericRoomId = Number(roomId);
    return this.roomDepartureMap?.[numericRoomId]?.[arrivalDate]
      ? Object.keys(this.roomDepartureMap[numericRoomId][arrivalDate])
      : [];
  }

  getStay(roomId: string, arrivalDate: string): Stay | null {
    // Ensure properties are safely accessed without throwing errors if null
    const numericRoomId = Number(roomId);
    const departures = this.roomDepartureMap?.[numericRoomId]?.[arrivalDate];
    if (departures) {
      const firstDepartureKey = Object.keys(departures)[0];
      return departures[firstDepartureKey];
    }
    return null;
  }

  ngOnDestroy(): void {
    // Properly unsubscribe to prevent memory leaks
    this.subscription.unsubscribe();
  }
}
