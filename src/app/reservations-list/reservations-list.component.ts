// reservations-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ReservationStorageService } from '../reservation-storage.service';

@Component({
  selector: 'app-reservations-list',
  templateUrl: './reservations-list.component.html',
  styleUrls: ['./reservations-list.component.css']
})
export class ReservationsListComponent implements OnInit {
  reservations: any[] = [];

  constructor(private reservationStorageService: ReservationStorageService) { }

  ngOnInit(): void {
    this.reservations = this.reservationStorageService.getReservations();
    console.log('Fetched Reservations:', this.reservations); // Debug log
  }
}
