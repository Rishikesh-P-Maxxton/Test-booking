import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { StayService } from '../stays.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation, Customer } from '../Interfaces/reservation';
import { ModalService } from '../services/modal-data.service';

interface Availability {
  start: Date;
  end: Date;
  arrivalDays?: Record<string, { minStay: number; maxStay: number }>; // Optional for reservations
}

interface RoomData {
  roomId: number;
  availability: Availability[];
  reservations: Availability[];
  arrivalDays: Record<string, { minStay: number; maxStay: number }>; // Detailed arrival days with stay requirements
}


@Component({
  selector: 'app-room-availability-gantt',
  templateUrl: './room-availability-gantt.component.html',
  styleUrls: ['./room-availability-gantt.component.css'],
})
export class RoomAvailabilityGanttComponent implements OnInit {
openBookingModal() {
throw new Error('Method not implemented.');
}
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

//   selectedRoom: Room | null = null;
//   startDate: Date | null = null;
//   endDate: Date | null = null;
// reservationId: string |undefined;
// roomNo: string|undefined;
// stayDateFrom: Date|undefined;
// stayDateTo: Date|undefined;

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private reservationStorageService: ReservationStorageService,
    private modalDataService: ModalService
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
    const availabilityMap: { [roomId: number]: Availability[] } = {};
    const reservationMap: { [roomId: number]: Availability[] } = {};
    const arrivalDaysMap: { [roomId: number]: Record<string, { minStay: number; maxStay: number }> } = {};
  
    // Initialize maps and records
    this.stays.forEach((stay) => {
      const roomId = stay.roomId;
      const startDate = new Date(stay.stayDateFrom);
      const endDate = new Date(stay.stayDateTo);
  
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
  
      // Initialize maps if not present
      if (!availabilityMap[roomId]) {
        availabilityMap[roomId] = [];
        arrivalDaysMap[roomId] = {}; // Initialize as record
      }
  
      // Add availability period for the room
      availabilityMap[roomId].push({
        start: startDate,
        end: endDate,
        arrivalDays: stay.arrivalDays.reduce((acc, day) => {
          acc[day] = {
            minStay: stay.minStay,
            maxStay: stay.maxStay,
          };
          return acc;
        }, {} as Record<string, { minStay: number; maxStay: number }>)
      });
  
      // Update arrivalDaysMap with stay requirements
      stay.arrivalDays.forEach((day) => {
        arrivalDaysMap[roomId][day] = {
          minStay: stay.minStay,
          maxStay: stay.maxStay,
        };
      });
    });
  
    // Process reservations
    this.reservations.forEach((reservation) => {
      const roomId = reservation.roomId;
      const startDate = new Date(reservation.arrivalDate);
      const endDate = new Date(reservation.departureDate);
  
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
  
      if (!reservationMap[roomId]) {
        reservationMap[roomId] = [];
      }
  
      // Add reservation period for the room
      reservationMap[roomId].push({
        start: startDate,
        end: endDate,
      });
    });
  
    // Update the availability table
    this.availabilityTable = this.rooms.map((room) => ({
      roomId: room.roomId,
      availability: availabilityMap[room.roomId] || [],
      reservations: reservationMap[room.roomId] || [],
      arrivalDays: arrivalDaysMap[room.roomId] || {},
    }));
    console.log(this.availabilityTable, "Availability table");
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
    this.addSelection(day, day, roomId); // Start with a single cell selection
}


  onMouseOver(roomId: number, day: number, event: MouseEvent) {
    
      if (this.isMouseDown && roomId === this.selectedRoomId) {
        this.endDay = day; // Track the ending day
        this.updateSelection(roomId); // updates selected range of cells
      
    }
  }

  onMouseUp(event: MouseEvent) {
    console.log(`onMouseUp - Selected Room ID: ${this.selectedRoomId}`);
    this.isMouseDown = false;
    if (this.selectedRoomId !== null) {
        this.validateSelection(this.selectedRoomId);
    }
}


selectRangeForMinimumStay(startDay: number, roomId: number): void {
  const roomData = this.availabilityTable.find(
    (data) => data.roomId === roomId
  );
  if (!roomData) return;

  // Find the availability period covering the start day
  const availabilityPeriod = roomData.availability.find(
    (period) =>
      startDay >= period.start.getDate() && startDay <= period.end.getDate()
  );
  if (!availabilityPeriod) return;

  // Get minStay for the arrival day
  const arrivalDay = new Date(this.year, this.selectedMonth - 1, startDay)
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();
  const minStay = roomData.arrivalDays[arrivalDay]?.minStay || 0;

  // Calculate endDay based on minStay
  let endDay = startDay + minStay - 1;

  // Ensure endDay does not exceed the availability period
  if (endDay > availabilityPeriod.end.getDate()) {
    endDay = availabilityPeriod.end.getDate();
  }

  // Check if the selection is blocked by any reservations
  if (this.isBlockedByReservation(roomId, startDay, endDay)) {
    console.log('Invalid selection: Cannot fulfill minimum stay requirement due to reservation overlap.');
    this.clearAllSelections();
    return;
  }

  // Check if the endDay meets the minimum stay criteria
  if (endDay >= startDay + minStay - 1) {
    // Clear previous selections and add new valid selection
    this.clearAllSelections();
    this.addSelection(startDay, endDay, roomId);
  } else {
    // Clear all selections if invalid
    console.log('Invalid selection: Minimum stay requirement not met.');
    this.clearAllSelections();
  }
}




private isBlockedByReservation(roomId: number, startDay: number, endDay: number): boolean {
  const roomData = this.availabilityTable.find(
    (data) => data.roomId === roomId
  );
  if (!roomData) return false;

  // Convert startDay and endDay to Date objects
  const startDate = new Date(this.year, this.selectedMonth - 1, startDay);
  const endDate = new Date(this.year, this.selectedMonth - 1, endDay);

  // Check if any reservation overlaps with the selection
  return roomData.reservations.some((reservation) => {
    const reservStartDate = new Date(reservation.start);
    const reservEndDate = new Date(reservation.end);

    // Check for overlap: 
    // 1. Reservation starts before selection ends
    // 2. Reservation ends after selection starts
    return reservStartDate <= endDate && reservEndDate >= startDate;
  });
}





// onCellClick(roomId: number, day: number): void {
//   console.log('on cell clicked');

//   if (this.isArrivalDay(roomId, day)) {
//     this.selectRangeForMinimumStay(day, roomId);
//   } else {
//     console.log('Clicked cell is not an arrival day.');
//     this.clearAllSelections();
//   }
// }
onCellClick(roomId: number, day: number): void {
  console.log(`onCellClick triggered - Room ID: ${roomId}, Day: ${day}`);

  // Log the current state
  console.log(`Current Room ID: ${this.selectedRoomId}`);
  console.log(`Current Start Day: ${this.startDay}`);
  console.log(`Current End Day: ${this.endDay}`);
  console.log(`Is Mouse Down: ${this.isMouseDown}`);

  // Check if the clicked cell is an arrival day
  if (this.isArrivalDay(roomId, day)) {
    console.log(`Cell is an arrival day. Proceeding with selection.`);
    
    // Log details of the room data
    const roomData = this.availabilityTable.find((data) => data.roomId === roomId);
    if (roomData) {
      console.log(`Room Data: `, roomData);
    } else {
      console.log(`No data found for Room ID: ${roomId}`);
    }
    
    // Log if selection range logic is applied
    console.log(`Calling selectRangeForMinimumStay for Day: ${day}, Room ID: ${roomId}`);
    this.selectRangeForMinimumStay(day, roomId);

    // Log the updated state after selection
    console.log(`Updated Start Day: ${this.startDay}`);
    console.log(`Updated End Day: ${this.endDay}`);
    console.log(`Selected Cells: ${Array.from(this.selectedCells).join(', ')}`);
  } else {
    console.log(`Clicked cell is not an arrival day.`);
    
    // Clear all selections if cell is not an arrival day
    this.clearAllSelections();
    console.log(`Cleared all selections.`);
  }
}


  isArrivalDay(roomId: number, day: number): boolean {
    const roomData = this.availabilityTable.find((data) => data.roomId === roomId);
    if (!roomData) return false;
  
    const date = new Date(this.year, this.selectedMonth - 1, day);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  
    return roomData.arrivalDays.hasOwnProperty(dayOfWeek);
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

    // roomData.reservations.forEach((reservation) => {
    //     const reservationStart = reservation.start.getDate();
    //     const reservationEnd = reservation.end.getDate();

    //     if (currentStart <= reservationEnd && currentEnd >= reservationStart) {
    //         if (currentStart < reservationStart) {
    //             this.addSelection(currentStart, reservationStart - 1, roomId);
    //         }
    //         currentStart = Math.max(currentEnd + 1, reservationEnd + 1);
    //     }
    // });

    if (currentStart <= currentEnd && !this.isBlockedByReservation( roomId, currentStart, currentEnd )) {
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

    const isAvailable = roomData.availability.some(
      (avail) => date >= avail.start && date <= avail.end
    );

    // Check if the date is within a reserved period
    const isBooked = roomData.reservations.some(
      (reserv) => date >= reserv.start && date <= reserv.end
    );

    return isAvailable && !isBooked; 

    // Only allow clicks if the cell is available and not reserved
  }

  getCellClass(roomId: number, day: number): string {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    date.setHours(0, 0, 0, 0); // Normalize date to start at midnight

    const roomData = this.availabilityTable.find(
      (data) => data.roomId === roomId
    );
    if (!roomData) return '';

    
    
    const isArrivalDay = this.isArrivalDay(roomId, day);
    const isAvailable = roomData.availability.some(
      (avail) => date >= avail.start && date <= avail.end
    );

    const isReserved = roomData.reservations.some(
      (reserv) => date >= reserv.start && date <= reserv.end
    );
    const isSelected = this.selectedCells.has(`${roomId}-${day}`);
    if (isArrivalDay && isAvailable && !isReserved) {
      return isSelected ? 'selected-arrival-day' : 'arrival-day'; // Highlight arrival days with a specific color
    }

    if (isReserved) return 'reserved'; // Red color for reservations
    if (isAvailable) return isSelected ? 'selected available' : 'available'; // Green color for availability
    if (isSelected) return 'selected'; // Blue color for selected cells
    return 'not-available'; // Default color
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
  
    const availabilityPeriod = roomData.availability.find(
      (period) => start >= period.start.getDate() && end <= period.end.getDate()
    );
  
    if (!availabilityPeriod) {
      this.clearAllSelections();
      console.log("cleared in !availablity");
      
      return;
    }
  
    const arrivalDay = new Date(this.year, this.selectedMonth - 1, start)
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toUpperCase();
  
    const minStay = roomData.arrivalDays[arrivalDay]?.minStay || 0;
    const maxStay = roomData.arrivalDays[arrivalDay]?.maxStay || 0;
  
    if (minStay > 0 && (selectedDays.length < minStay || selectedDays.length > maxStay)) {
      this.clearAllSelections();
      return;
    }
  
    // if (this.checkOverlap(start, end, roomData)) {
    //   this.clearAllSelections();
    //   console.log("in this.checkOverlap(start, end, roomData ")
    // }
  }
  


  // checkOverlap(start: number, end: number, roomData: RoomData): boolean {
  //   return roomData.reservations.some((reservation) => {
  //     const reservStart = reservation.start.getDate();
  //     const reservEnd = reservation.end.getDate();
  //     return start <= reservEnd && end >= reservStart;
  //   });
  // }

  addSelection(start: number, end: number, roomId: number) {
    for (let day = start; day <= end; day++) {
      const cellKey = `${roomId}-${day}`;
      // Add the cell to selectedCells
      this.selectedCells.add(cellKey);
      console.log('current selectedCells', this.selectedCells);

      console.log(cellKey, 'added');
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

  // openBookingModal(): void {
  //   this.showModal = true;
  //   if (this.selectedRoomId !== null && this.startDay !== undefined && this.endDay !== undefined) {
  //     this.selectedRoom = this.rooms.find(room => room.roomId === this.selectedRoomId) || null;
  //     this.startDate = new Date(this.year, this.selectedMonth - 1, this.startDay);
  //     this.endDate = new Date(this.year, this.selectedMonth - 1, this.endDay);
  //     this.showModal = true;
  //   }
  // }

  // handleModalClose(): void {
  //   this.showModal = false;
  // }


  //codes for modal

  sendSelectionToService(): void {
    if (this.selectedRoomId !== null && this.startDay !== undefined && this.endDay !== undefined) {
      const selectedRoom = this.rooms.find(room => room.roomId === this.selectedRoomId);
  
      if (selectedRoom) {
        const modalData = {
          roomId: this.selectedRoomId,
          startDate: new Date(this.year, this.selectedMonth - 1, this.startDay),
          endDate: new Date(this.year, this.selectedMonth - 1, this.endDay)
        };
  
        this.modalDataService.setModalData(modalData);
  
        // Optional: If you want to trigger opening the modal here
        // this.openModal(); // Implement this method if needed to open the modal
      } else {
        console.log('Selected room not found.');
      }
    } else {
      console.log('No valid selection to send.');
    }
  }
  
  isSelectionValid(): boolean {
    // Return true if a selection is valid and ready to send
    return this.selectedRoomId !== null && this.startDay !== undefined && this.endDay !== undefined;
  }
  


 
  
}
