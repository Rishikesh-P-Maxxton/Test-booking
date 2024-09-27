import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Customer, Reservation } from '../Interfaces/reservation';

@Component({
  selector: 'app-filter-navs',
  templateUrl: './filter-navs.component.html',
  styleUrls: ['./filter-navs.component.css']
})
export class FilterNavsComponent implements OnInit, OnDestroy {

  activeReservationsCount: number = 0;
  checkedInCount: number = 0;
  confirmedCount: number = 0;
  checkedOutCount: number = 0;
  
  totalReservationsCount: number = 0; // Total of checked in + confirmed
  checkedInPercent: number = 0;
  confirmedPercent: number = 0;
  checkedOutPercent: number = 0;

  private subscription: Subscription = new Subscription();
  checkedInDashArray!: string;
  confirmedDashArray!: string;
  checkedOutDashArray!: string;

  constructor(private reservationStorageService: ReservationStorageService) { }

  ngOnInit(): void {
    // Subscribe to active reservations and booking history
    this.subscription.add(
      this.reservationStorageService.getReservationsObservable().subscribe(reservations => {
        this.updateActiveReservations(reservations);
      })
    );

    this.subscription.add(
      this.reservationStorageService.getBookingHistoryObservable().subscribe(history => {
        this.checkedOutCount = history.length; // Total checked-out reservations
        this.updatePieChartData();
      })
    );
  }

  updateActiveReservations(reservations: Array<{ reservation: Reservation, customer: Customer }>) {
    // Filter the active reservations by their status
    this.checkedInCount = reservations.filter(r => r.reservation.status === 'CHECKED-IN').length;
    this.confirmedCount = reservations.filter(r => r.reservation.status === 'CONFIRM').length;

    // Update total active reservations (checked-in + confirmed)
    this.totalReservationsCount = this.checkedInCount + this.confirmedCount;
    this.updatePieChartData();
  }

  updatePieChartData() {
    const totalReservations = this.checkedInCount + this.confirmedCount;

    if (totalReservations > 0) {
      // Calculate the circumference of the pie (using the circle radius 14 for your SVG)
      const circumference = 2 * Math.PI * 14;

      // Calculate the stroke-dasharray for each segment based on the counts
      this.checkedInDashArray = `${(this.checkedInCount / totalReservations) * circumference} ${(totalReservations - this.checkedInCount) / totalReservations * circumference}`;
      this.confirmedDashArray = `${(this.confirmedCount / totalReservations) * circumference} ${(totalReservations - this.confirmedCount) / totalReservations * circumference}`;
    }
}





  ngOnDestroy(): void {
    this.subscription.unsubscribe(); // Clean up subscriptions
  }
}
