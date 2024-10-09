import { Component, OnInit } from '@angular/core';
import { RoomService } from '../services/room.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Reservation } from '../Interfaces/reservation';
import { Stay } from '../Interfaces/stay';
import { Room } from '../Interfaces/room';
import { StayService } from '../services/stays.service';
import { ArrivalDepartureService } from '../services/arrival-departure.service';
import { Subscription } from 'rxjs';
import { RoomDepartureMap } from '../Interfaces/roomdeparturemap';
import { DualCalendarTriggerService } from '../dual-calendar-trigger-service.service';


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

  roomDepartureMap: RoomDepartureMap | null = null;
Optimap: RoomDepartureMap | null = null;
  private subscription: Subscription = new Subscription();

  showInvalidSelectionAlert: boolean = false;

  
  validArrivalDaysMap: { [roomId: number]: Set<string> } = {};
  isArrivalDayFlag: boolean = false; // Track if mouse down is on an arrival day
  validDepartureDaysMap: { [roomId: number]: Set<string> } = {}; // Store valid departure days for a selected arrival day

  
  isMouseDown: boolean = false;
  selectedRoomId: number | null = null;
  startDay: Date | null = null;
  endDay: Date | null = null;
  selectedCells: Set<string> = new Set();
  


  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private reservationStorageService: ReservationStorageService,
    private arrivalDepartureService: ArrivalDepartureService, private dualCalendarTriggerService: DualCalendarTriggerService
  ) {
    const today = new Date();
    this.selectedMonth = today.getMonth();
    this.year = today.getFullYear();
  }
  
  ngOnInit(): void {
     // Trigger the initialization of DualCalendarComponent
     console.log('Triggering DualCalendarComponent initialization from OtherComponent...');
     this.dualCalendarTriggerService.initialize();
    this.roomService.getRooms().subscribe((rooms) => {
      this.rooms = rooms;
      this.stayService.getStays().subscribe((stays) => {
        this.stays = stays;
  
        // Subscribe to the optimized map and use it consistently
        this.subscription.add(
          this.arrivalDepartureService.getOptimizedRoomDepartureMap().subscribe(
            (optimizedMap: RoomDepartureMap | null) => {
              if (optimizedMap) {
                console.log('Optimized Room Departure Map:', optimizedMap);
                this.Optimap=optimizedMap;
                this.generateValidArrivalDaysMap(optimizedMap); // Use optimizedMap initially
              } else {
                console.log('No optimized map available.');
              }
            }
          )
        );
  
        // Retrieve both reservations and customers from local storage
        const reservationData = this.reservationStorageService.getReservations();
        this.reservations = reservationData.map(item => item.reservation);
        this.customers = reservationData.map(item => item.customer);
  
        this.generateChart();
        setTimeout(() => {
          this.scrollToToday(); // Smooth scroll to today's date after rendering
          this.initializeTooltips(); // Initialize tooltips after rendering the chart
        }, 0);
      });
    });
  }
  
  
  generateValidArrivalDaysMap(optimizedMap: RoomDepartureMap): void {
    this.validArrivalDaysMap = {};
  
    for (const roomId in optimizedMap) {
      if (optimizedMap.hasOwnProperty(roomId)) {
        this.validArrivalDaysMap[+roomId] = new Set<string>();
  
        for (const arrivalDate in optimizedMap[roomId]) {
          if (optimizedMap[roomId].hasOwnProperty(arrivalDate)) {
            // Split the arrivalDate string to extract year, month, and day
            const [yearStr, monthStr, dayStr] = arrivalDate.split('-');
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10) - 1; // Convert from one-based to zero-based index for Date object creation
            const day = parseInt(dayStr, 10);
  
            // Create a JavaScript Date object
            const dateObj = new Date(year, month, day);
  
            // Format the corrected date back to string with correct month indexing (one-based)
            const correctedArrivalDateKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
  
            // Add the corrected date string as a valid arrival day for the room
            this.validArrivalDaysMap[+roomId].add(correctedArrivalDateKey);
          }
        }
      }
    }
    console.log('valid arrival days', this.validArrivalDaysMap )
  }
  
  isValidArrivalDay(roomId: number, dayObj: DayObj): boolean {
    // Convert dayObj to the same format as used in validArrivalDaysMap (YYYY-MM-DD)
    const arrivalDateKey = `${dayObj.year}-${(dayObj.month + 1).toString().padStart(2, '0')}-${dayObj.day.toString().padStart(2, '0')}`;
    return this.validArrivalDaysMap[roomId]?.has(arrivalDateKey) ?? false;
  }
  


  
  onMouseDown(roomId: number, dayObj: DayObj, event: MouseEvent): void {
    event.preventDefault();
  
    if (this.isValidArrivalDay(roomId, dayObj)) {
      this.isArrivalDayFlag = true;
      this.selectedRoomId = roomId;
      this.startDay = new Date(dayObj.year, dayObj.month, dayObj.day);
      this.endDay = this.startDay;
  
      this.reduceToSelectedArrivalDay(roomId, dayObj);
      this.selectedCells.clear();
      this.addSelection(this.startDay, roomId);
      this.isMouseDown = true;
  
      // Set the valid departure dates for the selected arrival date
      this.setDepartureDatesForArrival(roomId, dayObj);
    } else {
      // Do not start selection on non-arrival days
      console.log('Not a valid arrival day, selection not started.');
      this.isMouseDown = false;
    }
  }
  
  showInvalidSelectionMessage(): void {
    this.showInvalidSelectionAlert = true;
  
    // Automatically hide the alert after 5 seconds
    setTimeout(() => {
      this.showInvalidSelectionAlert = false;
    }, 5000); // Adjust the duration as needed (5000 milliseconds = 5 seconds)
  }
  
  closeInvalidSelectionAlert(): void {
    this.showInvalidSelectionAlert = false;
  }
  
  
  
  onMouseOver(roomId: number, dayObj: DayObj, event: MouseEvent): void {
    if (this.isMouseDown) {
      // Ensure we're still within the same room
      if (roomId !== this.selectedRoomId) {
        this.clearAllSelections(); // Invalidate the selection
        return;
      }
  
      // Create a Date object for the current day being hovered
      const currentDate = new Date(dayObj.year, dayObj.month, dayObj.day);
  
      // Prevent dragging to a date before the start date (leftward dragging)
      if (currentDate < this.startDay!) {
        this.clearAllSelections();
        return; // Do not expand selection to the left
      }
  
      // Get the last valid departure date for the selected arrival day
      const lastValidDepartureDate = this.getLastValidDepartureDate(this.selectedRoomId!);
  
      // If currentDate is after the last valid departure date, limit it
      if (lastValidDepartureDate && currentDate > lastValidDepartureDate) {
        this.endDay = lastValidDepartureDate;
      } else {
        this.endDay = currentDate;
      }
  
      // Check if the current cell is selectable
      if (!this.isCellSelectable(roomId, dayObj)) {
        // If the cell is not selectable, reset the selection
        console.log('Non-selectable cell encountered, resetting selection at:', dayObj);
        this.clearAllSelections();
        this.hideDepartureDates(); // Hide departure dates
        return;
      }
  
      // Update the selection
      this.updateSelection(this.startDay, this.endDay, roomId);
    }
  }
  
  
  
 
 
  onMouseUp(): void {
    this.isMouseDown = false;
  
    if (this.selectedRoomId && this.startDay && this.endDay) {
      if (this.startDay.getTime() === this.endDay.getTime()) {
        console.log('Single cell selected, invalidating selection.');
        this.clearAllSelections();
        this.hideDepartureDates();
        this.showInvalidSelectionMessage(); // Show alert
      } else {
        if (this.isArrivalDayFlag) {
          const endDayKey = `${this.endDay.getFullYear()}-${(this.endDay.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${this.endDay.getDate().toString().padStart(2, '0')}`;
  
          if (!this.validDepartureDaysMap[this.selectedRoomId!]?.has(endDayKey)) {
            console.log('Invalid selection - does not end at a valid departure day.');
            this.clearAllSelections();
            this.hideDepartureDates();
            this.showInvalidSelectionMessage(); // Show alert
          } else {
            console.log('Valid selection.', this.startDay, this.endDay);
            this.reduceToSelectedDepartureDay(this.selectedRoomId!, endDayKey);
          }
        }
      }
    } else {
      this.clearAllSelections();
      this.hideDepartureDates();
      this.showInvalidSelectionMessage(); // Show alert
    }
  
    this.subscription.add(
      this.arrivalDepartureService.getOptimizedRoomDepartureMap().subscribe(
        (optimizedMap: RoomDepartureMap | null) => {
          if (optimizedMap) {
            this.generateValidArrivalDaysMap(optimizedMap);
            this.updateArrivalDayUI();
          }
        }
      )
    );
  
    this.isArrivalDayFlag = false;
  }
  
  


  isCellSelectable(roomId: number, dayObj: DayObj): boolean {
    // First, check if the cell is reserved
    const isReserved = this.isCellReserved(roomId, dayObj);
  
    if (!isReserved) {
      // If the cell is not reserved, it is selectable
      return true;
    } else {
      // If the cell is reserved, check if it is both a valid departure day and the start of a reservation
      const departureDateKey = `${dayObj.year}-${(dayObj.month + 1)
        .toString()
        .padStart(2, '0')}-${dayObj.day.toString().padStart(2, '0')}`;
  
      const isValidDeparture = this.validDepartureDaysMap[roomId]?.has(departureDateKey) ?? false;
      const isReservationStart = this.isReservationStartingToday(roomId, dayObj);
  
      // The cell is selectable only if it is a valid departure day and the start of a reservation
      return isValidDeparture && isReservationStart;
    }
  }
  
  hideDepartureDates(): void {
    this.validDepartureDaysMap = {}; // Clear the map, removing all visible departure days
    this.updateArrivalDayUI(); // Trigger the UI update to remove the departure day rendering
  }
  
  
  
  
  reduceToSelectedArrivalDay(roomId: number, dayObj: DayObj): void {
    // Convert dayObj to the format used in validArrivalDaysMap (YYYY-MM-DD)
    const arrivalDateKey = `${dayObj.year}-${(dayObj.month + 1).toString().padStart(2, '0')}-${dayObj.day.toString().padStart(2, '0')}`;
  
    // Update validArrivalDaysMap to keep only the selected arrival day
    this.validArrivalDaysMap = { [roomId]: new Set([arrivalDateKey]) };
  
    // Log the reduced valid arrival days for debugging
    console.log('Reduced valid arrival days:', this.validArrivalDaysMap);
  }
  
  updateArrivalDayUI(): void {
    // Trigger change detection by updating component state
    // Depending on your rendering approach, you might need to trigger a UI update manually.
    // Here we're just ensuring the validArrivalDaysMap is up-to-date.
    this.generateChart(); // Ensure this function redraws the cells based on the latest validArrivalDaysMap
  }
  
  
  isCellReserved(roomId: number, dayObj: DayObj): boolean {
    const reservation = this.reservations.find((res) => {
      const reservationStartDate = new Date(res.arrivalDate);
      const reservationEndDate = new Date(res.departureDate);
      
      // Adjust times to ensure consistent comparison
      reservationStartDate.setHours(11, 0, 0, 0);
      reservationEndDate.setHours(10, 0, 0, 0);
  
      const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
      currentDay.setHours(12, 0, 0, 0);
  
      return (
        res.roomId === roomId &&
        currentDay >= reservationStartDate &&
        currentDay < reservationEndDate
      );
    });
  
    return !!reservation; // Return true if a reservation is found
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
    // Skip reservations for the selected room during selection
    // if (this.isArrivalDayFlag && roomId === this.selectedRoomId) {
    //   return 'available';
    // }
  
    const roomData = this.rooms.find(room => room.roomId === roomId);
    if (!roomData) return 'not-available';
  
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(19, 0, 0, 0); // Set to midday for comparison
  
    // Check if the current day falls within any reservation period
    const reservation = this.reservations.find((res) => {
      const reservationStartDate = new Date(res.arrivalDate);
      reservationStartDate.setHours(11, 0, 0, 0); // Check-in at 11:00 AM
  
      // Adjust reservation end date to include the departure date
      const reservationEndDate = new Date(res.departureDate);
      reservationEndDate.setDate(reservationEndDate.getDate() + 1); // Move to next day
      reservationEndDate.setHours(10, 0, 0, 0); // Check-out at 10:00 AM
  
      return (
        res.roomId === roomId &&
        currentDay >= reservationStartDate &&
        currentDay < reservationEndDate // Use '<' to include departure date
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
  
    const cellKey = `${roomId}-${dayObj.year}-${dayObj.month}-${dayObj.day}`;
  
    if (this.selectedCells.has(cellKey)) {
      classes += ' selected';
      return classes;
    }
  
    const isValidArrival = this.isValidArrivalDay(roomId, dayObj);
    const statusClass = this.getCellClass(roomId, dayObj);
  
    const departureDateKey = `${dayObj.year}-${(dayObj.month + 1)
      .toString()
      .padStart(2, '0')}-${dayObj.day.toString().padStart(2, '0')}`;
    const isValidDeparture = this.validDepartureDaysMap[roomId]?.has(departureDateKey);
  
    // Check if we are in selection mode
    const isSelecting = this.isMouseDown && this.isArrivalDayFlag && this.selectedRoomId === roomId;
  
    if (this.isReservationEndingOnArrivalDay(roomId, dayObj)) {
      classes += ' split-reservation-arrival';
  
      if (statusClass && statusClass !== 'available') {
        classes += ` ${statusClass}`;
      }
      classes += ' valid-arrival-day';
    } else if (this.isReservationStartingToday(roomId, dayObj)) {
      classes += ' split-reservation-start';
  
      if (statusClass && statusClass !== 'available') {
        classes += ` ${statusClass}`;
      }
  
      // Apply special styling only during selection when departure days are shown
      if (isValidDeparture && isSelecting) {
        classes += ' valid-departure-day';
      }
    } else {
      if (statusClass) {
        classes += ` ${statusClass}`;
      }
      if (isValidArrival) {
        classes += ' valid-arrival-day';
      }
      if (isValidDeparture) {
        classes += ' valid-departure-day';
      }
    }
  
    return classes;
  }
  
  
  
  getLastValidDepartureDate(roomId: number): Date | null {
    const validDepartureDatesSet = this.validDepartureDaysMap[roomId];
    if (!validDepartureDatesSet || validDepartureDatesSet.size === 0) {
      return null;
    }
  
    // Convert the set to an array of Date objects
    const validDepartureDates = Array.from(validDepartureDatesSet).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  
    // Find the latest date
    const lastDate = validDepartureDates.reduce((latest, date) => {
      return date > latest ? date : latest;
    }, validDepartureDates[0]);
  
    return lastDate;
  }
  
  // Check if a reservation starts today and is not overlapping
isReservationStartingToday(roomId: number, dayObj: DayObj): boolean {
  const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
  currentDay.setHours(19, 0, 0, 0); // Set to 7:00 PM (consistent with your other time settings)

  // Find reservations starting today
  const reservationsStartingToday = this.reservations.filter((res) => {
    const reservationStartDate = new Date(res.arrivalDate);
    reservationStartDate.setHours(19, 0, 0, 0);

    return res.roomId === roomId && currentDay.getTime() === reservationStartDate.getTime();
  });

  // If there is no reservation starting today, return false
  if (reservationsStartingToday.length === 0) {
    return false;
  }

  // Check for overlapping reservations on the current day
  const overlappingReservations = this.reservations.filter((res) => {
    if (res.roomId !== roomId) return false;

    const reservationStartDate = new Date(res.arrivalDate);
    reservationStartDate.setHours(11, 0, 0, 0); // Check-in at 11:00 AM

    const reservationEndDate = new Date(res.departureDate);
    reservationEndDate.setHours(10, 0, 0, 0); // Check-out at 10:00 AM

    // Check if the current day falls within the reservation period
    return currentDay >= reservationStartDate && currentDay < reservationEndDate;
  });

  // If there's more than one overlapping reservation, it's an overlap
  return overlappingReservations.length === 1; // Only the reservation starting today
}

  
  
  isReservationEndingOnArrivalDay(roomId: number, dayObj: DayObj): boolean {
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(19, 0, 0, 0); // Set to 7:00 PM
  
    const isValidArrival = this.isValidArrivalDay(roomId, dayObj);
    if (!isValidArrival) {
      return false;
    }
  
    const reservationEndingToday = this.reservations.find((res) => {
      const reservationEndDate = new Date(res.departureDate);
      reservationEndDate.setHours(19, 0, 0, 0); // Set to 7:00 PM
  
      return res.roomId === roomId && currentDay.getTime() === reservationEndDate.getTime();
    });
  
    return !!reservationEndingToday;
  }
  
  
  
  
  
  
  
  
  getTooltipForCell(roomId: number, dayObj: DayObj): string | null {

  
  if (this.isArrivalDayFlag && roomId === this.selectedRoomId) {
    return null;
  }

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
  
  onCellClick(roomId: number, dayObj: DayObj): void {
    const clickedDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    console.log(`Room ID: ${roomId}, Date: ${clickedDate.toDateString()}`);
  }
  

  getValidDepartureDates(roomId: number, arrivalDateKey: string): Set<string> {
    if (this.roomDepartureMap && this.roomDepartureMap[roomId] && this.roomDepartureMap[roomId][arrivalDateKey]) {
      return new Set(Object.keys(this.roomDepartureMap[roomId][arrivalDateKey]));
    }
    return new Set();
  }

    
  setDepartureDatesForArrival(roomId: number, arrivalDayObj: DayObj): void {
    if (!this.Optimap) {
      console.warn('Room departure map is not available.');
      return;
    }
  
    // Convert dayObj to string format used in roomDepartureMap (YYYY-MM-DD)
    const arrivalDateKey = `${arrivalDayObj.year}-${(arrivalDayObj.month + 1).toString().padStart(2, '0')}-${arrivalDayObj.day.toString().padStart(2, '0')}`;
  
    // Check if the roomId and arrivalDateKey are present in the map
    if (this.Optimap[roomId] && this.Optimap[roomId][arrivalDateKey]) {
      // Extract the valid departure dates from the object and create a Set
      const validDepartures = Object.keys(this.Optimap[roomId][arrivalDateKey]);
      this.validDepartureDaysMap = {
        [roomId]: new Set(validDepartures)
      };
  
      // Log the selected arrival and corresponding departure dates for debugging
      console.log(`Selected arrival date: ${arrivalDateKey}`);
      console.log('Valid departure days:', this.validDepartureDaysMap[roomId]);
    } else {
      console.warn('No valid departure dates found for the selected arrival.');
      this.validDepartureDaysMap = {};
    }
  }

  reduceToSelectedDepartureDay(roomId: number, selectedDepartureDateKey: string): void {
    // Update validDepartureDaysMap to keep only the selected departure day
    this.validDepartureDaysMap = {
      [roomId]: new Set([selectedDepartureDateKey])
    };
  
    // Log the reduced valid departure days for debugging
    console.log('Reduced valid departure days:', this.validDepartureDaysMap);
  }
  
  
  
}