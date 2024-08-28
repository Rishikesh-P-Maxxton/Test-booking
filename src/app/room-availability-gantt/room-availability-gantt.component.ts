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
  arrivalDays?: Set<string>; // Arrival days for this specific availability
  minStay?: number; // Optional minStay for this availability
  maxStay?: number; // Optional maxStay for this availability
}


interface RoomData {
  roomId: number;
  availability: Availability[];
  reservations: Availability[];
  arrivalDays: Set<string>; // Set of unique arrival days for the room
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
  const arrivalDaysMap: { [roomId: number]: Set<string> } = {};

  // Initialize maps and sets
  this.stays.forEach(stay => {
    const roomId = stay.roomId;
    const startDate = new Date(stay.stayDateFrom);
    const endDate = new Date(stay.stayDateTo);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // Initialize maps if not present
    if (!availabilityMap[roomId]) {
      availabilityMap[roomId] = [];
      arrivalDaysMap[roomId] = new Set<string>(); // Initialize as Set
    }

    // Add availability period for the room
    availabilityMap[roomId].push({
      start: startDate,
      end: endDate,
      arrivalDays: new Set(stay.arrivalDays), // Store arrival days for this period
      minStay: stay.minStay,
      maxStay: stay.maxStay
    });

    // Add arrival days to the map (using spread operator)
    stay.arrivalDays.forEach(day => arrivalDaysMap[roomId].add(day));
  });

  // Process reservations
  this.reservations.forEach(reservation => {
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
  this.availabilityTable = this.rooms.map(room => ({
    roomId: room.roomId,
    availability: availabilityMap[room.roomId] || [],
    reservations: reservationMap[room.roomId] || [],
    arrivalDays: arrivalDaysMap[room.roomId] || new Set<string>()
  }));
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
  



  selectRangeForMinimumStay(startDay: number, roomId: number): void {
    const roomData = this.availabilityTable.find(data => data.roomId === roomId);
    if (!roomData) return;
  
    const availabilityPeriod = roomData.availability.find(period => 
      startDay >= period.start.getDate() && startDay <= period.end.getDate()
    );
  
    if (!availabilityPeriod) return;
  
    const minStay = availabilityPeriod.minStay || 0;
    const maxStay = availabilityPeriod.maxStay || 0;
  
    const endDayMin = startDay + minStay - 1;
    const endDayMax = startDay + maxStay - 1;
  
    const validEndDayMin = Math.min(endDayMin, availabilityPeriod.end.getDate());
    const validEndDayMax = Math.min(endDayMax, availabilityPeriod.end.getDate());
  
    this.clearAllSelections();
  
    for (let day = startDay; day <= validEndDayMax; day++) {
      if (day <= validEndDayMin) {
        this.addSelection(day, day, roomId);
      }
    }
  }
  
  

  onCellClick(roomId: number, day: number): void {
    console.log("on cell clicked");
  
    if (this.isArrivalDay(roomId, day)) {
      this.selectRangeForMinimumStay(day, roomId);
    } else {
      console.log("Clicked cell is not an arrival day.");
      this.clearAllSelections();
    }
  }
  
  


  isArrivalDay(roomId: number, day: number): boolean {
    const roomData = this.availabilityTable.find(data => data.roomId === roomId);
    if (!roomData) return false;
  
    const date = new Date(this.year, this.selectedMonth - 1, day);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  
    return roomData.arrivalDays.has(dayOfWeek);
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

    const isArrivalDay = this.isArrivalDay(roomId, day);
    if (!roomData) return '';

    const isAvailable = roomData.availability.some(
      avail => date >= avail.start && date <= avail.end
    );

    const isReserved = roomData.reservations.some(
      reserv => date >= reserv.start && date <= reserv.end
    );
 const isSelected = this.selectedCells.has(`${roomId}-${day}`);
    if (isArrivalDay && isAvailable && !isReserved) {
      return isSelected ? 'selected arrival-day' : 'arrival-day'; // Highlight arrival days with a specific color
    }
   
    if (isReserved) return 'reserved'; // Red color for reservations
    if (isAvailable) return isSelected ? 'selected available' : 'available'; // Green color for availability
    if (isSelected) return 'selected'; // Blue color for selected cells
    return 'not-available'; // Default color
  }

  // Validation and Selection Finalization
  validateSelection(roomId: number): void {
    const roomData = this.availabilityTable.find(data => data.roomId === roomId);
    if (!roomData) return;
  
    const selectedDays = Array.from(this.selectedCells)
      .filter(cell => cell.startsWith(`${roomId}-`))
      .map(cell => parseInt(cell.split('-')[1], 10))
      .sort((a, b) => a - b);
  
    if (selectedDays.length === 0) return;
  
    const start = selectedDays[0];
    const end = selectedDays[selectedDays.length - 1];
  
    const availabilityPeriod = roomData.availability.find(period => 
      start >= period.start.getDate() && end <= period.end.getDate()
    );
  
    if (!availabilityPeriod) {
      this.clearAllSelections();
      return;
    }
  
    const minStay = availabilityPeriod.minStay || 0;
    const maxStay = availabilityPeriod.maxStay || 0;
  
    if (selectedDays.length < minStay || selectedDays.length > maxStay) {
      this.clearAllSelections();
      return;
    }
  
    if (this.checkOverlap(start, end, roomData)) {
      this.clearAllSelections();
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
