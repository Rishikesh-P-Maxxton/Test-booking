
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { Customer, Reservation } from '../Interfaces/reservation';
import { ReservationStorageService } from '../services/reservation-storage.service';
@Component({
  selector: 'app-filter-navs',
  templateUrl: './filter-navs.component.html',
  styleUrl: './filter-navs.component.css'
})
export class FilterNavsComponent {

  reservationCount: number = 0; // Property to hold the count
  private subscription: Subscription = new Subscription();

  constructor(private reservationStorageService: ReservationStorageService) { }

  ngOnInit(): void {
    // Subscribe to reservation changes
    this.subscription.add(
      this.reservationStorageService.getReservationsObservable().subscribe(reservations => {
        this.reservationCount = reservations.length; // Update the count
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.subscription.unsubscribe();
  }
}
