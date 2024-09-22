import { Component, OnInit } from '@angular/core';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Reservation, Customer } from '../Interfaces/reservation';

@Component({
  selector: 'app-booking-history',
  templateUrl: './booking-history.component.html',
  styleUrls: ['./booking-history.component.css']
})
export class BookingHistoryComponent implements OnInit {

  reservations: Array<{ reservation: Reservation, customer: Customer }> = [];

  constructor(private reservationStorageService: ReservationStorageService) { }

  ngOnInit(): void {
    this.loadBookingHistory();
  }

  loadBookingHistory(): void {
    // Fetch reservations from the 'bookingHistory' storage key
    this.reservations = this.reservationStorageService.getBookingHistory();
    console.log('Fetched Booking History:', this.reservations); // Debug log
  }

  deleteReservation(reservationId: string): void {
    this.reservationStorageService.deleteReservation(reservationId);
    this.loadBookingHistory(); // Refresh the list after deletion
  }

  clearReservations(): void {
    this.reservationStorageService.clearBookingHistory();
    this.loadBookingHistory(); // Reload reservations to reflect the cleared data
  }
  onSelectionConfirmed(selectionData: any): void {
    console.log('Received selection:', selectionData);
    // Do something with the selectionData, like storing it or passing it to another service
  }
  
}
