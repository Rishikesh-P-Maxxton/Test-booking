import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReservationStorageService {

  private storageKey = 'reservations';

  constructor() { }

  // Save a reservation to local storage
  saveReservation(reservation: any): void {
    const existingReservations = this.getReservations();
    existingReservations.push(reservation);
    localStorage.setItem(this.storageKey, JSON.stringify(existingReservations));
  }

  // Retrieve all reservations from local storage
  getReservations(): any[] {
    const reservations = localStorage.getItem(this.storageKey);
    return reservations ? JSON.parse(reservations) : [];
  }

  // Clear all reservations (optional)
  clearReservations(): void {
    localStorage.removeItem(this.storageKey);
  }

}
