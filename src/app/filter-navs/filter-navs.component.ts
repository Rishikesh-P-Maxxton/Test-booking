
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

 
  confirmedPercent: number = 30; // Example percentage for Confirmed
  checkedInPercent: number = 80; // Example percentage for Checked In
  checkedOutPercent: number = 20; // Example percentage for Checked Out

  confirmedDashArray!: string;
  checkedInDashArray!: string;
  checkedOutDashArray!: string;

  constructor(private reservationStorageService: ReservationStorageService) { }

  ngOnInit(): void {

    // Subscribe to reservation changes
    this.subscription.add(
      this.reservationStorageService.getReservationsObservable().subscribe(reservations => {
        this.reservationCount = reservations.length; // Update the count
      })
    );
    this.updatePieChartData();
  }
  updatePieChartData() {
    // Example total percentage should be 100
    this.confirmedDashArray = `${this.confirmedPercent} ${100 - this.confirmedPercent}`;
    this.checkedInDashArray = `${this.checkedInPercent} ${100 - this.checkedInPercent}`;
    this.checkedOutDashArray = `${this.checkedOutPercent} ${100 - this.checkedOutPercent}`;
  }


  ngOnDestroy(): void {
    // Clean up subscription
    this.subscription.unsubscribe();
  }
}
