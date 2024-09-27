import { Component, OnInit, ViewChild } from '@angular/core';
import { RoomService } from '../services/room.service';
import { StayService } from '../services/stays.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation } from '../Interfaces/reservation';

import { ModalComponent } from '../modal/modal.component';
import { BookingDetails } from '../Interfaces/booking-details';


interface Availability {
  start: Date;
  end: Date;

  status?: "CONFIRM" | "CHECKED-IN" | "CHECKED-OUT";
}

interface RoomData {
  roomId: number;
  stays: Stay[]; // Array of Stay objects for room availability
  reservations: Availability[]; // Array of Availability objects for reservations
}



@Component({
  selector: 'app-room-availability-gantt',
  templateUrl: './room-availability-gantt.component.html',
  styleUrls: ['./room-availability-gantt.component.css'],
})
export class RoomAvailabilityGanttComponent implements OnInit {

  @ViewChild('modal') modalComponent!: ModalComponent;
  months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 },
  ];

  rooms: Room[] = [];
  stays: Stay[] = [];
  reservations: Reservation[] = [];
  availabilityTable: RoomData[] = [];
  days: number[] = [];
  selectedMonth: number = new Date().getMonth() + 1;
  year: number = new Date().getFullYear();
  selectedRoomId: number | null = null;
  startDay: number | undefined;
  endDay: number | undefined;
  isMouseDown = false;
  selectedCells: Set<string> = new Set();
  




  selectedMonthName: number= new Date().getMonth() + 1;
  showModal: boolean = false;


  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private reservationStorageService: ReservationStorageService,
    
  ) {}

  // Initialization and Data Handling
  ngOnInit(): void {
    this.roomService.getRooms().subscribe((rooms) => {
      this.rooms = rooms;
      this.stayService.getStays().subscribe((stays) => {
        this.stays = stays;
        this.loadReservations(); // Load reservations after rooms and stays are fetched
      });
    });
    console.log('ngOnInit: Component initialization ended.');
  }

  private loadReservations(): void {
    const reservationData = this.reservationStorageService.getReservations();
    this.reservations = reservationData.map((item) => item.reservation); // Extract reservation objects
    this.updateRoomAvailability();
    this.generateChart(this.selectedMonth);
  }
  // Updates room availability based on stays and reservations
  updateRoomAvailability(): void {
    const reservationMap: { [roomId: number]: Availability[] } = {};
  
    // Process reservations to map them by roomId
    this.reservations.forEach((reservation) => {
      const roomId = reservation.roomId;
      const startDate = new Date(reservation.arrivalDate);
      const endDate = new Date(reservation.departureDate);
  
      // Set check-in and check-out times for reservations
      startDate.setHours(11, 0, 0, 0); // Check-in at 11:00 AM
      endDate.setHours(10, 0, 0, 0);   // Check-out at 10:00 AM
  
      if (!reservationMap[roomId]) {
        reservationMap[roomId] = [];
      }
  
      reservationMap[roomId].push({
        start: startDate,
        end: endDate,
        status: reservation.status, // Track reservation status
      });
    });
  
    // Create the availabilityTable by mapping rooms with their stays and reservations
    this.availabilityTable = this.rooms.map((room) => ({
      roomId: room.roomId,
      stays: this.stays.filter(stay => stay.roomId === room.roomId), // Assign stays from the API filtered by roomId
      reservations: reservationMap[room.roomId] || [] // Assign reservations from the reservationMap for this room
    }));
  
    // Log the availabilityTable for verification
    console.log(this.availabilityTable, "Updated availability table with stays and reservations.");
  }
  
  
  
  
  

  // Utility Functions
  isWeekend(day: number): boolean {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  previousMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.year--;
    } else {
      this.selectedMonth--;
    }
    this.generateChart(this.selectedMonth);
    this.clearAllSelections();
  }

  nextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.year++;
    } else {
      this.selectedMonth++;
    }
    this.generateChart(this.selectedMonth);
    this.clearAllSelections();
  }

  getMonthName(monthNumber: number): string {
    const month = this.months.find(m => m.value === monthNumber);
    return month ? month.name : '';
  }

  getCurrentMonthName(): string {
    return this.getMonthName(this.selectedMonth);
  }
  

  getDayName(day: number): string {
    const year = 2024;
    const date = new Date(year, this.selectedMonth - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., "Sun", "Mon"
  }

  generateChart(month: number): void {
    const daysInMonth = new Date(this.year, month, 0).getDate();
    this.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }


  onMouseDown(roomId: number, day: number, event: MouseEvent) {
    console.log(`onMouseDown triggered - Room ID: ${roomId}, Day: ${day}`);
    event.preventDefault();
    this.isMouseDown = true;
  
    // Check if the starting day is an arrival day
    if (!this.isArrivalDay(roomId, day)) {
      console.log('Starting day is not an arrival day. Clearing selection.');
      this.clearAllSelections(); // Clear all selections if starting day is not an arrival day
      return;
    }
  
    // Clear previous selection if any
    if (this.selectedRoomId !== null) {
      console.log(`Clearing previous selection for Room ID: ${this.selectedRoomId}`);
      this.clearAllSelections();
    }
  
    this.selectedRoomId = roomId;
    this.startDay = day; // Track the starting day
  
    console.log(`Check-in at 11:00 AM on day ${day}`);
    
    this.addSelection(day, day, roomId); // Start with a single cell selection
  }
  


  onMouseOver(roomId: number, day: number, event: MouseEvent) {
    event.preventDefault();
    if (this.isMouseDown && roomId === this.selectedRoomId) {
      this.endDay = day; // Track the ending day
      this.updateSelection(roomId); // Update the selected range of cells
  
      console.log(`Updating selection range - Start: ${this.startDay}, End: ${this.endDay}`);
    }
  }
  

  onMouseUp(event: MouseEvent) {
    console.log(`onMouseUp - Selected Room ID: ${this.selectedRoomId}`);
    this.isMouseDown = false;
  
    // Ensure startDay and endDay are defined before proceeding
    if (this.selectedRoomId !== null && this.startDay !== undefined && this.endDay !== undefined) {
      // If startDay and endDay are the same, auto-extend the selection by 1 day
      if (this.startDay === this.endDay) {
        console.log('Auto-extending selection to next day for a one-night stay.');
        this.endDay = this.startDay + 1;
      }
  
      // Validate the selection after possibly extending it
      this.validateSelection(this.selectedRoomId);
  
      // If the selection is valid, finalize it
      if (this.isSelectionValid()) {
        this.takeSelections();
      } else {
        console.log('Selection is not valid. No action taken.');
      }
    } else {
      console.log("startDay or endDay is undefined, cannot proceed.");
    }
  }
  
  
  

  public takeSelections(): void {
    if (this.selectedRoomId !== null) {
      this.validateSelection(this.selectedRoomId);
  
      if (this.selectedCells.size > 0) {
        const selectedDays = Array.from(this.selectedCells)
          .filter(cell => cell.startsWith(`${this.selectedRoomId}-`))
          .map(cell => parseInt(cell.split('-')[1], 10))
          .sort((a, b) => a - b);
  
        if (selectedDays.length > 0) {
          const startDay = selectedDays[0];
          const endDay = selectedDays[selectedDays.length - 1];
  
          // Set arrival and departure times
          const arrivalDate = new Date(this.year, this.selectedMonth - 1, startDay, 11, 0, 0); // 11:00 AM check-in
          const departureDate = new Date(this.year, this.selectedMonth - 1, endDay + 1, 10, 0, 0); // 10:00 AM checkout next day
  
          // Ensure departureDate falls on the next day if booking only one night
          if (endDay === startDay) {
            departureDate.setDate(departureDate.getDate() + 1); // Shift to the next day 10:00 AM
          }
  
          const roomDetails = this.rooms.find(room => room.roomId === this.selectedRoomId);
  
          if (roomDetails) {
            const bookingDetails: BookingDetails = {
              roomId: roomDetails.roomId,
              locationId: roomDetails.locationId,
              roomName: roomDetails.roomName,
              pricePerDayPerPerson: roomDetails.pricePerDayPerPerson,
              arrivalDate: arrivalDate,
              departureDate: departureDate,
              locationName: roomDetails.locationName,
              guestCapacity: roomDetails.guestCapacity
            };
  
            // Log booking details before passing to modal
            console.log('Booking Details:', bookingDetails);
  
            // Pass data to the modal component
            if (this.modalComponent) {
              this.modalComponent.bookingDetails = bookingDetails;
              this.modalComponent.ngOnInit(); // Call ngOnInit to initialize form with new data
            }
  
            const modalElement = document.getElementById('bookingsModal');
            if (modalElement) {
              const modal = new bootstrap.Modal(modalElement);
              modal.show();
            } else {
              console.error('Modal element not found');
            }
          }
        }
      }
    }
  }
  
  








private isBlockedByReservation(roomId: number, startDay: number, endDay: number): boolean {
  const roomData = this.availabilityTable.find((data) => data.roomId === roomId);
  if (!roomData) return false;

  const startDate = new Date(this.year, this.selectedMonth - 1, startDay);
  const endDate = new Date(this.year, this.selectedMonth - 1, endDay);

  // Check if any reservation overlaps with the selection
  return roomData.reservations.some((reservation) => {
    const reservStartDate = new Date(reservation.start);
    const reservEndDate = new Date(reservation.end);

    // Check for overlap: Reservation starts before selection ends and ends after selection starts
    return reservStartDate <= endDate && reservEndDate >= startDate;
  });
}






isArrivalDay(roomId: number, day: number): boolean {
  const roomData = this.availabilityTable.find((data) => data.roomId === roomId);
  if (!roomData) return false;

  const date = new Date(this.year, this.selectedMonth - 1, day);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  // Now we check directly from the stays array
  return roomData.stays.some(stay =>
    new Date(stay.stayDateFrom) <= date &&
    new Date(stay.stayDateTo) >= date &&
    stay.arrivalDays.includes(dayOfWeek) // Check if the day is in the list of valid arrival days
  );
}

  

  // Utility Functions for Event Handlers
  updateSelection(roomId: number): void {
    if (this.startDay === undefined || this.endDay === undefined) return;
  
    const start = Math.min(this.startDay, this.endDay);
    const end = Math.max(this.startDay, this.endDay);
  
    this.clearAllSelections();
  
    const roomData = this.availabilityTable.find((data) => data.roomId === roomId);
    if (!roomData) return;
  
    let currentStart = start;
    let currentEnd = end;
  
    // Process reservations, avoid blocking selections by reservations
    roomData.reservations.forEach((reservation) => {
      const reservationStart = reservation.start.getDate();
      const reservationEnd = reservation.end.getDate();
  
      if (currentStart <= reservationEnd && currentEnd >= reservationStart) {
        if (currentStart < reservationStart) {
          this.addSelection(currentStart, reservationStart - 1, roomId);
        }
        currentStart = Math.max(currentEnd + 1, reservationEnd + 1);
      }
    });
  
    if (currentStart <= currentEnd && !this.isBlockedByReservation(roomId, currentStart, currentEnd)) {
      this.addSelection(currentStart, currentEnd, roomId);
    }
  
    this.validateSelection(roomId);
  }
  


  isCellClickable(roomId: number, day: number): boolean {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    date.setHours(0, 0, 0, 0); // Normalize date to start at midnight
  
    const roomData = this.availabilityTable.find(
      (data) => data.roomId === roomId
    );
    if (!roomData) return false;
  
    // Check if the date falls within any available stay
    const isAvailable = roomData.stays.some(
      (stay) => date >= new Date(stay.stayDateFrom) && date <= new Date(stay.stayDateTo)
    );
  
    // Check if the date is within a reserved period
    const isBooked = roomData.reservations.some(
      (reserv) => date >= reserv.start && date <= reserv.end
    );
  
    // The cell is clickable only if it's available and not booked
    return isAvailable && !isBooked;
  }
  

  getCellClass(roomId: number, day: number): string {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    date.setHours(0, 0, 0, 0); // Normalize date to start at midnight
  
    const roomData = this.availabilityTable.find((data) => data.roomId === roomId);
    if (!roomData) return '';
  
    // Check if the date is an arrival day
    const isArrivalDay = roomData.stays.some(stay => 
      new Date(stay.stayDateFrom) <= date &&
      new Date(stay.stayDateTo) >= date &&
      stay.arrivalDays.includes(date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase())
    );
  
    // Check if the date falls within any available stay
    const isAvailable = roomData.stays.some(
      (stay) => date >= new Date(stay.stayDateFrom) && date <= new Date(stay.stayDateTo)
    );
  
    // Check reservation status (e.g., "CONFIRM", "CHECKED-IN", or "CHECKED-OUT")
    const isReserved = roomData.reservations.some(
      (reserv) => date >= reserv.start && date <= reserv.end && reserv.status === 'CONFIRM'
    );
    
    const isCheckedIn = roomData.reservations.some(
      (reserv) => date >= reserv.start && date <= reserv.end && reserv.status === 'CHECKED-IN'
    );
    
    const isCheckedOut = roomData.reservations.some(
      (reserv) => date >= reserv.start && date <= reserv.end && reserv.status === 'CHECKED-OUT'
    );
  
    const isSelected = this.selectedCells.has(`${roomId}-${day}`);
  
    // Determine the appropriate class based on the conditions
    if (isArrivalDay && isAvailable && !isReserved && !isCheckedIn && !isCheckedOut) {
      return isSelected ? 'selected-arrival-day' : 'arrival-day'; // Highlight arrival days with a specific color
    }
  
    if (isReserved && isCheckedIn && isArrivalDay) {
      return 'checkedin-arrival-day'; // Specific class for checked-in on arrival day
    }
    if (isReserved && isCheckedOut && isArrivalDay) {
      return 'checkedout-arrival-day'; // Specific class for checked-out on arrival day
    }
  
    if (isCheckedIn) return 'checkedin';
    if (isCheckedOut) return 'checkedout';
    if (isReserved) return 'reserved'; // Red color for reservations
  
    if (isAvailable) return isSelected ? 'selected available' : 'available'; 
    if (isSelected) return 'selected'; // Blue color for selected cells
  
    return 'not-available'; // Default color for cells that are not available
  }
  

  // Validation and Selection Finalization
  validateSelection(roomId: number): void {
    const roomData = this.availabilityTable.find((data) => data.roomId === roomId);
    if (!roomData) return;
  
    const selectedDays = Array.from(this.selectedCells)
      .filter((cell) => cell.startsWith(`${roomId}-`))
      .map((cell) => parseInt(cell.split('-')[1], 10))
      .sort((a, b) => a - b);
  
    if (selectedDays.length === 0) return;
  
    const start = selectedDays[0];
    const end = selectedDays[selectedDays.length - 1];
    const startDate = new Date(this.year, this.selectedMonth - 1, start);
    const endDate = new Date(this.year, this.selectedMonth - 1, end);
  
    // Find the stay that matches the selected startDate and endDate
    const matchedStay = roomData.stays.find(stay =>
      new Date(stay.stayDateFrom) <= startDate &&
      new Date(stay.stayDateTo) >= endDate &&
      stay.arrivalDays.includes(startDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()) &&
      stay.departureDays.includes(endDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase())
    );
  
    if (!matchedStay) {
      console.log("Selection is invalid: No matching stay found.");
      this.clearAllSelections();
      return;
    }
  
    // Calculate the number of nights
    const nights = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  
    if (nights < matchedStay.minStay) {
      console.log(`Selection is invalid: ${nights} nights is less than the required MinStay of ${matchedStay.minStay} nights.`);
      this.clearAllSelections();
      return;
    }
  
    if (nights > matchedStay.maxStay) {
      console.log(`Selection is invalid: ${nights} nights exceeds the MaxStay of ${matchedStay.maxStay} nights.`);
      this.clearAllSelections();
      return;
    }
  
    // If the selection is valid, print the minStay and maxStay for the selected stay
    console.log(`Selection is valid. MinStay: ${matchedStay.minStay}, MaxStay: ${matchedStay.maxStay}`);
  }
  
  
  
  
  

  

  addSelection(start: number, end: number, roomId: number) {
    for (let day = start; day <= end; day++) {
      const cellKey = `${roomId}-${day}`;
      this.selectedCells.add(cellKey);
      console.log(`Cell selected: ${cellKey}`);
    }
  }
  

  clearAllSelections() {
    this.selectedCells.clear();
  }

  isSelected(roomId: number, day: number): boolean {
    return this.selectedCells.has(`${roomId}-${day}`);
  }

  logSelectedRange(): void {
    const selectedDates: { roomId: number; start: Date; end: Date }[] = [];

    this.availabilityTable.forEach((roomData) => {
      const selectedDays = Array.from(this.selectedCells)
        .filter((cell) => cell.startsWith(`${roomData.roomId}-`))
        .map((cell) => parseInt(cell.split('-')[1], 10))
        .sort((a, b) => a - b);

      if (selectedDays.length > 0) {
        const start = new Date(
          this.year,
          this.selectedMonth - 1,
          selectedDays[0]
        );
        const end = new Date(
          this.year,
          this.selectedMonth - 1,
          selectedDays[selectedDays.length - 1]
        );

        selectedDates.push({
          roomId: roomData.roomId,
          start,
          end,
        });
      }
    });
    console.log('Selected Date Ranges:', selectedDates);
  }

  
  isSelectionValid(): boolean {
    // Return true if a selection is valid and ready to send
    return this.selectedRoomId !== null && this.startDay !== undefined && this.endDay !== undefined;
  }
  

  
 
  
}