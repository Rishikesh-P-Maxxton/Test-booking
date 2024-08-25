import { Component, HostListener, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { StayService } from '../stays.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation, Customer } from '../Interfaces/reservation';


interface Availability {
  start: Date;
  end: Date;
  width?: number; // To track the width of the resizable cell
  positionLeft?: number;
}

interface RoomData {
  roomId: number;
  availability: Availability[];
  reservations: Availability[];
  minStay: number; // Add minStay
  maxStay: number; // Add maxStay
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
  reservations: Reservation[] = []; // Change to match expected type
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

  ngOnInit(): void {
    this.roomService.getRooms().subscribe(rooms => {
      this.rooms = rooms;
      this.stayService.getStays().subscribe(stays => {
        this.stays = stays;
        this.loadReservations(); // Load reservations after rooms and stays are fetched
      });
    });
  }

  private loadReservations(): void {
    const reservationData = this.reservationStorageService.getReservations();
    this.reservations = reservationData.map(item => item.reservation); // Extract reservation objects
    this.updateRoomAvailability();
    this.generateChart(this.selectedMonth);
  }

  updateRoomAvailability(): void {
    const availabilityMap: { [roomId: number]: Availability[] } = {};
    const reservationMap: { [roomId: number]: Availability[] } = {};
    const minStayMap: { [roomId: number]: number } = {};
    const maxStayMap: { [roomId: number]: number } = {};

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
        width: this.calculateWidth(startDate, endDate),
        positionLeft: this.calculateLeftPosition(startDate)
      });

      // Update minStay and maxStay
      if (minStayMap[roomId] === undefined || stay.minStay < minStayMap[roomId]) {
        minStayMap[roomId] = stay.minStay;
      }
      if (maxStayMap[roomId] === undefined || stay.maxStay > maxStayMap[roomId]) {
        maxStayMap[roomId] = stay.maxStay;
      }
    });

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

    this.availabilityTable = this.rooms.map(room => ({
      roomId: room.roomId,
      availability: availabilityMap[room.roomId] || [],
      reservations: reservationMap[room.roomId] || [],
      minStay: minStayMap[room.roomId] || 0, // Set minStay
      maxStay: maxStayMap[room.roomId] || 0  // Set maxStay
    }));
  }

  generateChart(month: number): void {
    const daysInMonth = new Date(this.year, month, 0).getDate();
    this.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
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

  calculateWidth(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Add 1 to include both start and end dates
    return daysDiff * 20; // Adjust width per day as needed
  }

  calculateLeftPosition(startDate: Date): number {
    return (startDate.getDate() - 1) * 20; // Adjust left position per day as needed
  }

  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedMonth = Number(target.value);
    this.generateChart(this.selectedMonth);
    this.clearAllSelections();
  }

  isWeekend(day: number): boolean {
    const date = new Date(this.year, this.selectedMonth - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  onMouseDown(roomId: number, day: number, event: MouseEvent) {
    event.preventDefault();
    this.isMouseDown = true;

    // Check if there's an existing selection and clear it
    if (this.selectedRoomId !== null) {
      this.clearSelectionInRoom(this.selectedRoomId);
    }

    this.selectedRoomId = roomId;
    this.startDay = day; // Track the starting day
    this.toggleSelection(roomId, day);
  }

  onMouseOver(roomId: number, day: number, event: MouseEvent) {
    if (this.isMouseDown && roomId === this.selectedRoomId) {
      this.endDay = day; // Track the ending day
      this.updateSelection(roomId);
    }
  }

  onMouseUp(event: MouseEvent) {
    this.isMouseDown = false;
    if (this.selectedRoomId !== null) {
      this.validateSelection(this.selectedRoomId);
    }
  }

  onCellClick(roomId: number, day: number): void {
    // Prevent new single-cell selections if there's an existing selection
    if (this.selectedRoomId !== null) {
      return;
    }

    if (this.getCellClass(roomId, day) === 'available') {
      this.toggleSelection(roomId, day);
    }
  }

  toggleSelection(roomId: number, day: number) {
    const cellKey = `${roomId}-${day}`;
    if (this.selectedCells.has(cellKey)) {
      this.selectedCells.delete(cellKey);
    } else {
      this.selectedCells.add(cellKey);
    }
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

  checkOverlap(start: number, end: number, roomData: RoomData): boolean {
    return roomData.reservations.some(reservation => {
      const reservStart = reservation.start.getDate();
      const reservEnd = reservation.end.getDate();
      return (start <= reservEnd && end >= reservStart);
    });
  }

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

  addSelection(start: number, end: number, roomId: number) {
    for (let day = start; day <= end; day++) {
      this.toggleSelection(roomId, day);
    }
  }

  clearSelectionInRoom(roomId: number | null) {
    if (roomId === null) return;

    this.days.forEach(day => {
      const cellKey = `${roomId}-${day}`;
      if (this.selectedCells.has(cellKey)) {
        this.selectedCells.delete(cellKey);
      }
    });
  }

  clearAllSelections() {
    this.selectedCells.clear();
  }

  isSelected(roomId: number, day: number): boolean {
    return this.selectedCells.has(`${roomId}-${day}`);
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
  }}