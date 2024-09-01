import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Customer, Reservation } from '../Interfaces/reservation';

@Injectable({
  providedIn: 'root'
})
export class ReservationStorageService {
  private storageKey = 'reservations';
  private reservationsSubject = new BehaviorSubject<Array<{ reservation: Reservation, customer: Customer }>>(this.getReservations());

  constructor() { }

  // Save or update a reservation in local storage
  saveReservation(reservationData: { reservation: Reservation, customer: Customer }): void {
    if (!reservationData || !reservationData.reservation || !reservationData.customer) {
      console.error('Invalid reservation data:', reservationData);
      return;
    }

    const existingReservations = this.getReservations();
    const index = existingReservations.findIndex(
      res => res.reservation.reservationId === reservationData.reservation.reservationId
    );

    if (index !== -1) {
      // Update existing reservation
      existingReservations[index] = reservationData;
    } else {
      // Add new reservation
      existingReservations.push(reservationData);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(existingReservations));
    this.reservationsSubject.next(existingReservations);
  }

  // Retrieve all reservations from local storage
  getReservations(): Array<{ reservation: Reservation, customer: Customer }> {
    const reservations = localStorage.getItem(this.storageKey);
    return reservations ? JSON.parse(reservations) : [];
  }

  deleteReservation(reservationId: string): void {
    const existingReservations = this.getReservations();
    const updatedReservations = existingReservations.filter(
      res => res.reservation.reservationId !== reservationId
    );

    localStorage.setItem(this.storageKey, JSON.stringify(updatedReservations));
    this.reservationsSubject.next(updatedReservations);
  }
  // Clear all reservations
  clearReservations(): void {
    localStorage.removeItem(this.storageKey);
    this.reservationsSubject.next([]);
  }
  getReservationsObservable() {
    return this.reservationsSubject.asObservable();
  }
}
