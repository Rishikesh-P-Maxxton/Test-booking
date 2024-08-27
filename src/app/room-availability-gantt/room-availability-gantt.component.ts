import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { StayService } from '../stays.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation, Customer } from '../Interfaces/reservation';

interface Availability {
  start: Date;
  end: Date;

}

interface RoomData {
  roomId: number;
  availability: Availability[];
  reservations: Availability[];
  minStay: number; 
  maxStay: number; 
}

@Component({
  selector: 'app-room-availability-gantt',
  templateUrl: './room-availability-gantt.component.html',
  styleUrls: ['./room-availability-gantt.component.css']
})
export class RoomAvailabilityGanttComponent implements OnInit {

  months = [
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 }
  ];

  rooms: Room[] = [];
  stays: Stay[] = [];
  reservations: Reservation[] = []; 
  availabilityTable: RoomData[] = [];
  days: number[] = [];
  selectedMonth: number = 8;
  year: number = 2024;
  selectedRoomId: number | null = null;
  startDay: number | undefined;
  endDay: number | undefined;
  isMouseDown = false;
  selectedCells: Set<string> = new Set();

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private reservationStorageService: ReservationStorageService
  ) { }

  // Initialization and Data Handling
  ngOnInit(): void {
    this.roomService.getRooms().subscribe(rooms => {
      this.rooms = rooms;
      this.stayService.getStays().subscribe(stays => {
        this.stays = stays;
        this.loadReservations(); // Load reservations after rooms and stays are fetched
      });
    });
    console.log('ngOnInit: Component initialization ended.');
  }

  private loadReservations(): void {
    const reservationData = this.reservationStorageService.getReservations();
    this.reservations = reservationData.map(item => item.reservation); // Extract reservation objects
    this.updateRoomAvailability();
    this.generateChart(this.selectedMonth);
  }
 // Updates room availability based on stays and reservations
 updateRoomAvailability(): void {
  
  const availabilityMap: { [roomId: number]: Availability[] } = {};
  const reservationMap: { [roomId: number]: Availability[] } = {};
  const minStayMap: { [roomId: number]: number } = {};
  const maxStayMap: { [roomId: number]: number } = {};

  // Process stays to update availabilityMap and minStayMap/maxStayMap
  this.stays.forEach(stay => {
    const roomId = stay.roomId;
    const startDate = new Date(stay.stayDateFrom);
    const endDate = new Date(stay.stayDateTo);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (!availabilityMap[roomId]) {
      availabilityMap[roomId] = [];
    }

    availabilityMap[roomId].push({
      start: startDate,
      end: endDate,
      
      
    });
    

    // Update minStay and maxStay
    if (minStayMap[roomId] === undefined || stay.minStay < minStayMap[roomId]) {
      minStayMap[roomId] = stay.minStay;
    }
    if (maxStayMap[roomId] === undefined || stay.maxStay > maxStayMap[roomId]) {
      maxStayMap[roomId] = stay.maxStay;
    }
  });

  console.log('updateRoomAvailability: Availability and stay maps updated.', {
    availabilityMap,
    minStayMap,
    maxStayMap
  });

  // Process reservations to update reservationMap
  this.reservations.forEach(reservation => {
    const roomId = reservation.roomId;
    const startDate = new Date(reservation.arrivalDate);
    const endDate = new Date(reservation.departureDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (!reservationMap[roomId]) {
      reservationMap[roomId] = [];
    }

    reservationMap[roomId].push({
      start: startDate,
      end: endDate
    });
  });

  console.log('updateRoomAvailability: Reservation map updated.', reservationMap);

  // Update availabilityTable with processed data
  this.availabilityTable = this.rooms.map(room => ({
    roomId: room.roomId,
    availability: availabilityMap[room.roomId] || [],
    reservations: reservationMap[room.roomId] || [],
    minStay: minStayMap[room.roomId] || 0,
    maxStay: maxStayMap[room.roomId] || 0
  }));

  console.log('updateRoomAvailability: Availability table updated.', this.availabilityTable);
}

  // Utility Functions
  isWeekend(day: number): boolean {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
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

  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedMonth = Number(target.value);
    this.generateChart(this.selectedMonth);
    this.clearAllSelections();
  }

  // Event Handlers and Selection
  onMouseDown(roomId: number, day: number, event: MouseEvent) {
    console.log(`onMouseDown triggered - Room ID: ${roomId}, Day: ${day}`);
    event.preventDefault();
    this.isMouseDown = true;

    // Clear previous selection
    if (this.selectedRoomId !== null) {
        console.log(`Clearing previous selection for Room ID: ${this.selectedRoomId}`);
        this.clearSelectionInRoom(this.selectedRoomId);
    }

    this.selectedRoomId = roomId;
    this.startDay = day; // Track the starting day
    this.addSelection(day, day, roomId); // Start with a single cell selection
}

  
onMouseOver(roomId: number, day: number, event: MouseEvent) {
  if (this.isMouseDown && roomId === this.selectedRoomId) {
      this.endDay = day; // Track the ending day
      this.updateSelection(roomId); // This should be fine to call as is
  }
}

  
  onMouseUp(event: MouseEvent) {
    console.log(`onMouseUp - Selected Room ID: ${this.selectedRoomId}`);
    this.isMouseDown = false;
    if (this.selectedRoomId !== null) {
      this.validateSelection(this.selectedRoomId);
    }
  }
  

  onCellClick(roomId: number, day: number): void {
    console.log("on cell clicked");
    
    if (this.getCellClass(roomId, day) === 'available') {
      
        // Fetch the minimum stay for the selected room
        const roomData = this.availabilityTable.find(data => data.roomId === roomId);
        if (roomData) {
            const minStay = roomData.minStay;
            // Select cells from the clicked cell to the right for the minimum stay duration
            this.selectRangeForMinimumStay(day, minStay, roomId);
        }

    }
}

selectRangeForMinimumStay(startDay: number, minStay: number, roomId: number): void {
  // Calculate endDay based on the minimum stay
  const endDay = Math.min(startDay + minStay - 1, this.days[this.days.length - 1]); // Ensure endDay is within the month

  // Add selection for the calculated range
  this.addSelection(startDay, endDay, roomId);

  // Optionally, if you want to automatically clear previous selections, uncomment the following line:
  // this.clearSelectionInRoom(roomId);
}

  // Utility Functions for Event Handlers
 clearSelectionInRoom(roomId: number | null) {
    if (roomId === null) return;

    this.days.forEach(day => {
      const cellKey = `${roomId}-${day}`;
      if (this.selectedCells.has(cellKey)) {
        this.selectedCells.delete(cellKey);
      }
    });
  }

  updateSelection(roomId: number): void {
    if (this.startDay === undefined || this.endDay === undefined) return;

    const start = Math.min(this.startDay, this.endDay);
    const end = Math.max(this.startDay, this.endDay);

    this.clearSelectionInRoom(roomId);

    const roomData = this.availabilityTable.find(data => data.roomId === roomId);
    if (!roomData) return;

    let currentStart = start;
    let currentEnd = end;

    roomData.reservations.forEach(reservation => {
      const reservationStart = reservation.start.getDate();
      const reservationEnd = reservation.end.getDate();

      if (currentStart <= reservationEnd && currentEnd >= reservationStart) {
        if (currentStart < reservationStart) {
          this.addSelection(currentStart, reservationStart - 1, roomId);
        }
        currentStart = Math.max(currentEnd + 1, reservationEnd + 1);
      }
    });

    if (currentStart <= currentEnd) {
      this.addSelection(currentStart, currentEnd, roomId);
    }

    this.validateSelection(roomId);
  }

  isCellClickable(roomId: number, day: number): boolean {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    date.setHours(0, 0, 0, 0); // Normalize date to start at midnight

    const roomData = this.availabilityTable.find(data => data.roomId === roomId);

    if (!roomData) return false;

    const isAvailable = roomData.availability.some(
      avail => date >= avail.start && date <= avail.end
    );

    // Check if the date is within a reserved period
    const isBooked = roomData.reservations.some(
      reserv => date >= reserv.start && date <= reserv.end
    );

    return isAvailable && !isBooked; // Only allow clicks if the cell is available and not reserved
  }

  getCellClass(roomId: number, day: number): string {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    date.setHours(0, 0, 0, 0); // Normalize date to start at midnight

    const roomData = this.availabilityTable.find(data => data.roomId === roomId);

    if (!roomData) return '';

    const isAvailable = roomData.availability.some(
      avail => date >= avail.start && date <= avail.end
    );

    const isReserved = roomData.reservations.some(
      reserv => date >= reserv.start && date <= reserv.end
    );

    const isSelected = this.selectedCells.has(`${roomId}-${day}`);
    if (isReserved) return 'reserved'; // Red color for reservations
    if (isAvailable) return isSelected ? 'selected available' : 'available'; // Green color for availability
    if (isSelected) return 'selected'; // Blue color for selected cells
    return 'not-available'; // Default color
  }

  // Validation and Selection Finalization
  validateSelection(roomId: number): void {
    const roomData = this.availabilityTable.find(data => data.roomId === roomId);
    if (!roomData) return;

    const minStay = roomData.minStay;
    const maxStay = roomData.maxStay;

    const selectedDays = Array.from(this.selectedCells)
      .filter(cell => cell.startsWith(`${roomId}-`))
      .map(cell => parseInt(cell.split('-')[1], 10))
      .sort((a, b) => a - b);

    if (selectedDays.length < minStay || selectedDays.length > maxStay) {
      this.clearAllSelections();
      return;
    }

    const start = selectedDays[0];
    const end = selectedDays[selectedDays.length - 1];
    if (this.checkOverlap(start, end, roomData)) {
      this.clearAllSelections();
      return;
    }
  }

  checkOverlap(start: number, end: number, roomData: RoomData): boolean {
    return roomData.reservations.some(reservation => {
      const reservStart = reservation.start.getDate();
      const reservEnd = reservation.end.getDate();
      return (start <= reservEnd && end >= reservStart);
    });
  }

  addSelection(start: number, end: number, roomId: number) {
    for (let day = start; day <= end; day++) {
        const cellKey = `${roomId}-${day}`;
        // Add the cell to selectedCells
        this.selectedCells.add(cellKey);
        console.log("current selectedCells", this.selectedCells);
        
        console.log(cellKey, "added");
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

    this.availabilityTable.forEach(roomData => {
      const selectedDays = Array.from(this.selectedCells)
        .filter(cell => cell.startsWith(`${roomData.roomId}-`))
        .map(cell => parseInt(cell.split('-')[1], 10))
        .sort((a, b) => a - b);

      if (selectedDays.length > 0) {
        const start = new Date(this.year, this.selectedMonth - 1, selectedDays[0]);
        const end = new Date(this.year, this.selectedMonth - 1, selectedDays[selectedDays.length - 1]);

        selectedDates.push({
          roomId: roomData.roomId,
          start,
          end
        });
      }
    });
    console.log('Selected Date Ranges:', selectedDates);
  }
}
