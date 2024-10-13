import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArrivalDepartureService } from '../services/arrival-departure.service';
import { Subscription } from 'rxjs';
import { Stay } from '../Interfaces/stay';
import { RoomDepartureMap } from '../Interfaces/roomdeparturemap';
import { ReservationSharedService, SharedReservationDetails } from '../services/reservation-shared.service'; // Adjust path

@Component({
  selector: 'app-arrival-departure-dashboard',
  templateUrl: './arrival-departure-dashboard.component.html',
  styleUrls: ['./arrival-departure-dashboard.component.css'],
})
export class ArrivalDepartureDashboardComponent implements OnInit, OnDestroy {
  today: Date = new Date();
  roomDepartureMap: RoomDepartureMap | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    private arrivalDepartureService: ArrivalDepartureService,
    private reservationSharedService: ReservationSharedService // Inject the service properly
  ) {}

  ngOnInit(): void {
    // Subscribe to the Room Departure Map observable
    this.subscription.add(
      this.arrivalDepartureService.roomDepartureMap$.subscribe((map) => {
        this.roomDepartureMap = map;
        console.log('Dashboard received Room Departure Map:', this.roomDepartureMap);
      })
    );

    // Subscribe to the optimized Room Departure Map
    this.subscription.add(
      this.arrivalDepartureService.getOptimizedRoomDepartureMap().subscribe(
        (optimizedMap: RoomDepartureMap | null) => {
          if (optimizedMap) {
            console.log('Optimized Room Departure Map:', optimizedMap);
          } else {
            console.log('No optimized map available.');
          }
        }
      )
    );

    // Subscribe to the shared reservation observable
    this.subscription.add(
      this.reservationSharedService.selectedReservation$.subscribe(
        (reservation: SharedReservationDetails | null) => {
          if (reservation) {
            console.log('Received Reservation:', reservation); // Log the reservation object
          } else {
            console.log('No reservation selected yet.');
          }
        }
      )
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
