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


  isMouseDown: boolean = false;
  selectedRoomId: number | null = null;
  startDay: Date | null = null;
  endDay: Date | null = null;
  selectedCells: Set<string> = new Set();
  


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

  onMouseDown(roomId: number, dayObj: DayObj, event: MouseEvent): void {
    event.preventDefault();
    this.isMouseDown = true;
    this.selectedRoomId = roomId;
  
    // Create a Date object for the start day
    this.startDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    this.endDay = this.startDay;
    this.selectedCells.clear(); // Clear any previous selection
    this.addSelection(this.startDay, roomId);
  }
  
  
  onMouseOver(roomId: number, dayObj: DayObj, event: MouseEvent): void {
    if (this.isMouseDown) {
      // Ensure we're still within the same room
      if (roomId !== this.selectedRoomId) {
        this.clearAllSelections(); // Invalidate the selection
        return;
      }
  
      // Update the end day as we drag
      this.endDay = new Date(dayObj.year, dayObj.month, dayObj.day);
      this.updateSelection(this.startDay, this.endDay, roomId);
    }
  }
  
  
  onMouseUp(): void {
    this.isMouseDown = false;
  
    if (this.selectedRoomId && this.startDay && this.endDay) {
      // Check if the selection is a single-click (i.e., startDay equals endDay)
      if (this.startDay.getTime() === this.endDay.getTime()) {
        // Invalidate single-click selection
        console.log('Single-click detected, invalidating selection.');
        this.clearAllSelections();
      } else {
        // Finalize the valid selection
        console.log('Selection Finalized:', this.selectedCells);
      }
    } else {
      this.clearAllSelections(); // Clear if the selection was invalid
    }
  }
  

  addSelection(date: Date, roomId: number): void {
    const cellKey = `${roomId}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    this.selectedCells.add(cellKey);
  }
  
  
  updateSelection(startDay: Date | null, endDay: Date | null, roomId: number): void {
    if (!startDay || !endDay) return;
  
    // Clear previous selection
    this.selectedCells.clear();
  
    // Ensure startDay is before endDay
    let startDate = startDay < endDay ? startDay : endDay;
    let endDate = startDay > endDay ? startDay : endDay;
  
    // Iterate from start date to end date
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      this.addSelection(currentDate, roomId);
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }
  }
  
   
  clearAllSelections(): void {
    this.selectedCells.clear();
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

  getStatusesString(roomId: number, dayObj: DayObj): string | null {
    const overlapInfo = this.isOverlappingReservation(roomId, dayObj);
  
    // If overlapInfo is null or statuses is null, return null, otherwise join the statuses array
    if (overlapInfo && overlapInfo.statuses) {
      return overlapInfo.statuses.join(',');
    }
    
    return null;
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
  
    // Check for overlapping reservation first
    const overlapInfo = this.isOverlappingReservation(roomId, dayObj);
    if (overlapInfo.hasOverlap) {
      return 'split-reservation';
    }
  
    // If a reservation is found, return its class
    if (reservation) {
      if (reservation.status === 'CHECKED-IN') {
        return 'checked-in';
      } else if (reservation.status === 'CONFIRM') {
        return 'confirmed';
      }
    }
  
    return 'available';
  }
  
  

  isOverlappingReservation(roomId: number, dayObj: DayObj): { hasOverlap: boolean, statuses: [string, string] | null } {
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(12, 0, 0, 0);
  
    const reservationsForRoom = this.reservations.filter(res => res.roomId === roomId);
  
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
  
      if (currentReservationEnd.toDateString() === nextReservationStart.toDateString() &&
          currentReservationEnd.toDateString() === currentDay.toDateString()) {
        return {
          hasOverlap: true,
          statuses: [currentReservation.status, nextReservation.status]
        };
      }
    }
  
    return {
      hasOverlap: false,
      statuses: null
    };
  }
  
  getCombinedCellClass(roomId: number, dayObj: DayObj): string {
    let classes = 'cell';
  
    const overlapInfo = this.isOverlappingReservation(roomId, dayObj);
  
    // Add split-reservation if there is an overlap
    if (overlapInfo.hasOverlap) {
      classes += ' split-reservation';
    }
  
    // Append the reservation status class
    const statusClass = this.getCellClass(roomId, dayObj);
    if (statusClass && statusClass !== 'split-reservation') {
      classes += ` ${statusClass}`;
    }
  
    // Check if the cell is part of the selected range using the generated key
    const cellKey = `${roomId}-${dayObj.year}-${dayObj.month}-${dayObj.day}`;
    if (this.selectedCells.has(cellKey)) {
      classes += ' selected';
    }
  
    return classes;
  }
  
  
  
  
  getTooltipForCell(roomId: number, dayObj: DayObj): string | null {
    if (!this.isSecondDayOfReservation(roomId, dayObj)) {
      return null; // Tooltip should only be generated for the second day
    }
  
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(12, 0, 0, 0);
  
    // Find the reservation that includes the current day
    const reservation = this.reservations.find((res) => {
      const reservationStartDate = new Date(res.arrivalDate);
      const reservationEndDate = new Date(res.departureDate);
  
      reservationStartDate.setHours(11, 0, 0, 0);
      reservationEndDate.setHours(10, 0, 0, 0);
  
      return (
        res.roomId === roomId &&
        currentDay >= reservationStartDate &&
        currentDay < reservationEndDate
      );
    });
  
    if (reservation) {
      const customer = this.customers.find(cust => cust.customerId === reservation.customerId);
      if (customer) {
        return `
          <div class="tooltip-container">
            <strong>Customer:</strong> ${customer.firstName} ${customer.lastName}<br>
            <strong>Arrival:</strong> ${new Date(reservation.arrivalDate).toLocaleDateString()}<br>
            <strong>Departure:</strong> ${new Date(reservation.departureDate).toLocaleDateString()}<br>
            <strong>Amount Paid:</strong> $${reservation.paidAmount}
          </div>
        `;
      }
    }
  
    return null;
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
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl, {
        html: true // Allow HTML content in the tooltip
      });
    });
  }
  
  
  isSecondDayOfReservation(roomId: number, dayObj: DayObj): boolean {
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(12, 0, 0, 0);
  
    // Find the reservation that overlaps with the current day
    const reservation = this.reservations.find((res) => {
      const reservationStartDate = new Date(res.arrivalDate);
      const reservationEndDate = new Date(res.departureDate);
  
      reservationStartDate.setHours(11, 0, 0, 0);
      reservationEndDate.setHours(10, 0, 0, 0);
  
      return (
        res.roomId === roomId &&
        currentDay >= reservationStartDate &&
        currentDay < reservationEndDate
      );
    });
  
    if (reservation) {
      // Calculate the second day of the reservation
      const reservationStartDate = new Date(reservation.arrivalDate);
      reservationStartDate.setHours(11, 0, 0, 0);
      
      const secondDay = new Date(reservationStartDate);
      secondDay.setDate(secondDay.getDate() + 1);
      secondDay.setHours(12, 0, 0, 0);
  
      // Return true if currentDay matches the secondDay of the reservation
      return currentDay.getTime() === secondDay.getTime();
    }
  
    return false;
  }
  
  
}