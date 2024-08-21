import { Component, OnInit } from '@angular/core';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Reservation, Customer } from '../Interfaces/reservation';


@Component({
  selector: 'app-reservations-list',
  templateUrl: './reservations-list.component.html',
  styleUrls: ['./reservations-list.component.css']
})
export class ReservationsListComponent implements OnInit {
  reservations: Array<{ reservation: Reservation, customer: Customer }> = [];

  constructor(private reservationStorageService: ReservationStorageService) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservations = this.reservationStorageService.getReservations();
    console.log('Fetched Reservations:', this.reservations); // Debug log
  }

  updateStatus(reservationToUpdate: { reservation: Reservation, customer: Customer }): void {
    if (!reservationToUpdate || !reservationToUpdate.reservation) {
      console.error('Invalid reservation object:', reservationToUpdate);
      return;
    }

    // Update status in the reservation object
    reservationToUpdate.reservation.status = reservationToUpdate.reservation.status;

    // Save the updated reservation
    this.reservationStorageService.saveReservation(reservationToUpdate);

    // Reload reservations to reflect the changes
    this.loadReservations();
  }

  clearReservations(): void {
    this.reservationStorageService.clearReservations();
    this.loadReservations(); // Reload reservations to reflect the cleared data
  }
}
