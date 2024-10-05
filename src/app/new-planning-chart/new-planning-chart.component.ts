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
  customers: any[] = []; // Added customers array
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

        // Retrieve both reservations and customers from the local storage
        const reservationData = this.reservationStorageService.getReservations();
        this.reservations = reservationData.map(item => item.reservation);
        this.customers = reservationData.map(item => item.customer); // Assuming each reservation has a customer

        this.generateChart();
        setTimeout(() => {
          this.scrollToToday(); // Smooth scroll to today's date after rendering
          this.initializeTooltips(); // Initialize tooltips after rendering the chart
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
    currentDay.setHours(12, 0, 0, 0);
  
    // Check if the current day falls within any reservation period
    const reservation = this.reservations.find((res) => {
      const reservationStartDate = new Date(res.arrivalDate);
      const reservationEndDate = new Date(res.departureDate);
  
      // Adjust times to reflect industry standards
      reservationStartDate.setHours(11, 0, 0, 0);
      reservationEndDate.setHours(10, 0, 0, 0);
  
      return (
        res.roomId === roomId &&
        currentDay >= reservationStartDate &&
        currentDay < reservationEndDate
      );
    });
  
    if (this.isOverlappingReservation(roomId, dayObj)) {
      return 'split-reservation';
    }
  
    if (reservation) {
      if (reservation.status === 'CHECKED-IN') {
        return 'checked-in';
      } else if (reservation.status === 'CONFIRM') {
        return 'confirmed';
      }
    }
  
    return 'available';
  }
  

  isOverlappingReservation(roomId: number, dayObj: DayObj): boolean {
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(12, 0, 0, 0);
  
    const reservationsForRoom = this.reservations.filter(res => res.roomId === roomId);
  
    let hasOverlappingReservations = false;
  
    // Sort reservations by arrival date
    reservationsForRoom.sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());
  
    // Iterate over sorted reservations to check for overlap
    for (let i = 0; i < reservationsForRoom.length - 1; i++) {
      const currentReservation = reservationsForRoom[i];
      const nextReservation = reservationsForRoom[i + 1];
  
      const currentReservationEnd = new Date(currentReservation.departureDate);
      currentReservationEnd.setHours(10, 0, 0, 0);
  
      const nextReservationStart = new Date(nextReservation.arrivalDate);
      nextReservationStart.setHours(11, 0, 0, 0);
  
      // Check if current reservation ends and the next starts on the same day
      if (
        currentReservationEnd.toDateString() === nextReservationStart.toDateString() &&
        currentReservationEnd.toDateString() === currentDay.toDateString()
      ) {
        hasOverlappingReservations = true;
        break;
      }
    }
  
    return hasOverlappingReservations;
  }
  
  
  getTooltipForCell(roomId: number, dayObj: DayObj): string {
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(12, 0, 0, 0);

    // Find if there's a reservation starting on the current day
    const reservation = this.reservations.find((res) => {
      const reservationStartDate = new Date(res.arrivalDate);
      reservationStartDate.setHours(11, 0, 0, 0); // Arrival at 11 AM

      return (
        res.roomId === roomId &&
        reservationStartDate.toDateString() === currentDay.toDateString()
      );
    });

    // If a reservation is found, get the customer name using the customerId
    if (reservation) {
      const customer = this.customers.find(cust => cust.customerId === reservation.customerId);
      if (customer) {
        return `Customer: ${customer.firstName} ${customer.lastName} \nArrival: ${reservation.arrivalDate}\nDeparture: ${reservation.departureDate}\nAmount Paid: ${reservation.paidAmount}`;
      }
    }

    return '';
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

  initializeTooltips(): void {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}
