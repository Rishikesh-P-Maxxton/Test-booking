import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CalendarRoom } from '../Interfaces/calendar-room'; 

export interface SharedReservationDetails {
  arrivalDate: string;
  departureDate: string;
  room: CalendarRoom;
}

@Injectable({
  providedIn: 'root',
})
export class ReservationSharedService {
  // BehaviorSubject to store the shared reservation details
  private selectedReservationSubject = new BehaviorSubject<SharedReservationDetails | null>(null);

  // Observable to expose the selected reservation
  selectedReservation$ = this.selectedReservationSubject.asObservable();

  // Method to update the shared reservation
  setSelectedReservation(details: SharedReservationDetails): void {
    console.log('Emitting Reservation:', details);
    this.selectedReservationSubject.next(details);
  }
}
