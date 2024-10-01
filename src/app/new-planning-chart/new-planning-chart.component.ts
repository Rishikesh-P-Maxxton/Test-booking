import { Component, OnInit } from '@angular/core';
import { RoomService } from '../services/room.service';

import { ReservationStorageService } from '../services/reservation-storage.service';
import { Reservation } from '../Interfaces/reservation';
import { Stay } from '../Interfaces/stay';
import { Room } from '../Interfaces/room';
import { StayService } from '../services/stays.service';

interface DayObj {
  day: number;
  month: number;
  year: number;
}

@Component({
  selector: 'app-new-planning-chart',
  templateUrl: './new-planning-chart.component.html',
  styleUrls: ['./new-planning-chart.component.css']
})
export class NewPlanningChartComponent implements OnInit {

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  rooms: Room[] = [];
  stays: Stay[] = [];
  reservations: Reservation[] = [];
  days: DayObj[] = [];
  selectedMonth: number;
  year: number;

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private reservationStorageService: ReservationStorageService
  ) {
    const today = new Date();
    this.selectedMonth = today.getMonth();
    this.year = today.getFullYear();
  }

  ngOnInit(): void {
    this.roomService.getRooms().subscribe((rooms) => {
      this.rooms = rooms;
      this.stayService.getStays().subscribe((stays) => {
        this.stays = stays;
        this.reservations = this.reservationStorageService.getReservations().map(item => item.reservation);
        this.generateChart();
        setTimeout(() => {
          this.scrollToToday(); // Smooth scroll to today's date after rendering
        }, 0);
      });
    });
  }

  generateChart(): void {
    const totalMonths = 3; // Load three months at a time
    const startMonth = new Date().getMonth() - 1; // Start from the previous month
    const startYear = this.year;

    this.days = [];

    for (let i = 0; i < totalMonths; i++) {
      const currentMonth = (startMonth + i) % 12;
      const currentYear = startYear + Math.floor((startMonth + i) / 12);
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        this.days.push({ day, month: currentMonth, year: currentYear });
      }
    }
  }

  getCellClass(roomId: number, dayObj: DayObj): string {
    const roomData = this.rooms.find(room => room.roomId === roomId);
    if (!roomData) return 'not-available';

    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(0, 0, 0, 0);

    // Check if the current day falls within any reservation period
    const reservation = this.reservations.find(
      (res) =>
        res.roomId === roomId &&
        new Date(res.arrivalDate) <= currentDay &&
        new Date(res.departureDate) >= currentDay
    );

    if (reservation) {
      if (reservation.status === 'CHECKED-IN') {
        return 'checked-in';
      } else if (reservation.status === 'CONFIRM') {
        return 'confirmed';
      }
    }

    return 'available';
  }

  getDayName(dayObj: DayObj): string {
    const date = new Date(dayObj.year, dayObj.month, dayObj.day);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  }

  isWeekend(dayObj: DayObj): boolean {
    const date = new Date(dayObj.year, dayObj.month, dayObj.day);
    return date.getDay() === 6 || date.getDay() === 0;
  }

  scrollToToday(): void {
    const today = new Date();
    const dayElementId = `day-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const todayElement = document.getElementById(dayElementId);

    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
    }
  }
}