import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Customer, Reservation, ReservationStatus } from '../Interfaces/reservation';
import { of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationStorageService {
  private reservationsKey = 'reservations';
  private bookingHistoryKey = 'bookingHistory';
  private reservationsSubject = new BehaviorSubject<Array<{ reservation: Reservation, customer: Customer }>>(this.getReservations());
  private bookingHistorySubject = new BehaviorSubject<Array<{ reservation: Reservation, customer: Customer }>>(this.getBookingHistory());

  constructor() { }

  // Save or update a reservation in local storage
  saveReservation(reservationData: { reservation: Reservation, customer: Customer }): void {
    if (!reservationData || !reservationData.reservation || !reservationData.customer) {
      console.error('Invalid reservation data:', reservationData);
      return;
    }

    const existingReservations = this.getReservations();
    const existingBookingHistory = this.getBookingHistory();
    const index = existingReservations.findIndex(
      res => res.reservation.reservationId === reservationData.reservation.reservationId
    );

    if (reservationData.reservation.status === 'CHECKED-OUT') {
      // Remove from reservations if exists
      if (index !== -1) {
        existingReservations.splice(index, 1);
        this.saveToLocalStorage(this.reservationsKey, existingReservations);
        this.reservationsSubject.next(existingReservations);
      }

      // Add to booking history
      const historyIndex = existingBookingHistory.findIndex(
        res => res.reservation.reservationId === reservationData.reservation.reservationId
      );

      if (historyIndex === -1) {
        existingBookingHistory.push(reservationData);
      } else {
        existingBookingHistory[historyIndex] = reservationData;
      }
      
      this.saveToLocalStorage(this.bookingHistoryKey, existingBookingHistory);
      this.bookingHistorySubject.next(existingBookingHistory);
    } else {
      // Update existing reservation or add new one
      if (index !== -1) {
        existingReservations[index] = reservationData;
      } else {
        existingReservations.push(reservationData);
      }
      
      this.saveToLocalStorage(this.reservationsKey, existingReservations);
      this.reservationsSubject.next(existingReservations);
    }
  }

  // Update the status of a reservation
  updateReservationStatus(reservationId: string, newStatus: ReservationStatus): void {
    if (!this.isValidStatus(newStatus)) {
      console.error('Invalid status:', newStatus);
      return;
    }

    const existingReservations = this.getReservations();
    const index = existingReservations.findIndex(res => res.reservation.reservationId === reservationId);

    if (index !== -1) {
      existingReservations[index].reservation.status = newStatus;
      
      if (newStatus === 'CHECKED-OUT') {
        // Move to booking history if status is CHECKED-OUT
        const reservationData = existingReservations[index];
        existingReservations.splice(index, 1);
        this.saveToLocalStorage(this.reservationsKey, existingReservations);
        this.reservationsSubject.next(existingReservations);

        const existingBookingHistory = this.getBookingHistory();
        const historyIndex = existingBookingHistory.findIndex(
          res => res.reservation.reservationId === reservationId
        );

        if (historyIndex === -1) {
          existingBookingHistory.push(reservationData);
        } else {
          existingBookingHistory[historyIndex] = reservationData;
        }
        
        this.saveToLocalStorage(this.bookingHistoryKey, existingBookingHistory);
        this.bookingHistorySubject.next(existingBookingHistory);
      } else {
        // Update reservation status only
        this.saveToLocalStorage(this.reservationsKey, existingReservations);
        this.reservationsSubject.next(existingReservations);
      }
    }
  }

  // Retrieve all reservations from local storage
  getReservations(): Array<{ reservation: Reservation, customer: Customer }> {
    return this.getFromLocalStorage(this.reservationsKey) || [];
  }

  // Add this method to ReservationStorageService
  getCustomerById(customerId: string): Customer | undefined {
    if (!customerId) {
      return undefined;
    }
    
    const reservations = this.getReservations();
    const customer = reservations.find(res => res.customer.customerId === customerId)?.customer;
    return customer;
  }
  

  getCustomerByEmail(email: string): Observable<Customer | undefined> {
    if (!email) {
      return of(undefined); // Return an observable of undefined if email is empty
    }
  
    const reservations = this.getReservations();
    const customer = reservations.find(res => res.customer.email === email)?.customer;
    return of(customer); // Return the customer wrapped in an observable
  }
  


  // Retrieve all booking history from local storage
  getBookingHistory(): Array<{ reservation: Reservation, customer: Customer }> {
    return this.getFromLocalStorage(this.bookingHistoryKey) || [];
  }

  // Delete a reservation
  deleteReservation(reservationId: string): void {
    const existingReservations = this.getReservations();
    const updatedReservations = existingReservations.filter(
      res => res.reservation.reservationId !== reservationId
    );

    this.saveToLocalStorage(this.reservationsKey, updatedReservations);
    this.reservationsSubject.next(updatedReservations);
  }

  // Clear all reservations
  clearReservations(): void {
    localStorage.removeItem(this.reservationsKey);
    this.reservationsSubject.next([]);
  }

  // Clear booking history
  clearBookingHistory(): void {
    localStorage.removeItem(this.bookingHistoryKey);
    this.bookingHistorySubject.next([]);
  }

  // Get observable for reservations
  getReservationsObservable() {
    return this.reservationsSubject.asObservable();
  }

  // Get observable for booking history
  getBookingHistoryObservable() {
    return this.bookingHistorySubject.asObservable();
  }

  // Utility methods
  private saveToLocalStorage(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  

  private getFromLocalStorage(key: string): any {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // Utility method to check if a status is valid
  private isValidStatus(status: string): boolean {
    return ['CONFIRM', 'CHECKED-IN', 'CHECKED-OUT'].includes(status);
  }
}
