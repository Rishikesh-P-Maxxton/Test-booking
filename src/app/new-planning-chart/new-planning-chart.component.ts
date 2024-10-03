import { Component, OnInit, HostListener } from '@angular/core';
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

interface CalendarRoom extends Room {
  selectedStay?: Stay;
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
  customers: any[] = [];
  days: DayObj[] = [];
  selectedMonth: number;
  year: number;
  selectedArrivalDate: Date | null = null;
  selectedDepartureDate: Date | null = null;
  dragging: boolean = false;
  selectedRoomId: number | null = null;

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
        this.customers = reservationData.map(item => item.customer);

        this.generateChart();
        setTimeout(() => {
          this.scrollToToday();
          this.initializeTooltips();
        }, 0);
      });
    });
  }

  generateChart(): void {
    const totalMonths = 3;
    const startMonth = new Date().getMonth() - 1;
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

  getDayName(dayObj: DayObj): string {
    const date = new Date(dayObj.year, dayObj.month, dayObj.day);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  }

  isWeekend(dayObj: DayObj): boolean {
    const date = new Date(dayObj.year, dayObj.month, dayObj.day);
    return date.getDay() === 6 || date.getDay() === 0;
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

    if (reservation) {
      if (reservation.status === 'CHECKED-IN') {
        return 'checked-in';
      } else if (reservation.status === 'CONFIRM') {
        return 'confirmed';
      }
    }

    return 'available';
  }

  isWithinBookingWindow(date: Date, stay: Stay): boolean {
    const bookDateFrom = stay.bookDateFrom ? new Date(stay.bookDateFrom) : null;
    const bookDateTo = stay.bookDateTo ? new Date(stay.bookDateTo) : null;

    const validFrom = !bookDateFrom || date >= bookDateFrom;
    const validTo = !bookDateTo || date <= bookDateTo;

    return validFrom && validTo;
  }

  generateValidArrivalDatesForRoom(room: Room): Set<string> {
    const validDates = new Set<string>();

    room.stays.forEach((stay) => {
      const today = new Date();
      const minDeviation = stay.minDeviation ?? 0;
      const maxDeviation = stay.maxDeviation ?? Infinity;

      const minDate = new Date(today.getTime() + minDeviation * 24 * 60 * 60 * 1000);
      const maxDate = new Date(today.getTime() + maxDeviation * 24 * 60 * 60 * 1000);

      const stayDateFrom = new Date(stay.stayDateFrom);
      const stayDateTo = new Date(stay.stayDateTo);

      for (let date = new Date(minDate); date <= maxDate && date <= stayDateTo; date.setDate(date.getDate() + 1)) {
        if (date >= stayDateFrom && this.isWithinBookingWindow(date, stay)) {
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          if (stay.arrivalDays.includes(dayOfWeek)) {
            validDates.add(this.formatDateToYYYYMMDD(date));
          }
        }
      }
    });

    return validDates;
  }

  startDragging(roomId: number, dayObj: DayObj): void {
    const selectedDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    selectedDate.setHours(11, 0, 0, 0); // Set arrival time to 11 AM

    this.selectedArrivalDate = selectedDate;
    this.selectedRoomId = roomId;
    this.dragging = true;
  }

  onDragging(roomId: number, dayObj: DayObj): void {
    if (!this.dragging || this.selectedRoomId !== roomId) {
      return; // Dragging is only allowed within the same room
    }

    const selectedDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    if (this.selectedArrivalDate && selectedDate > this.selectedArrivalDate) {
      this.selectedDepartureDate = selectedDate;
    }
  }

  endDragging(): void {
    if (this.selectedArrivalDate && this.selectedDepartureDate) {
      const stayDuration = (this.selectedDepartureDate.getTime() - this.selectedArrivalDate.getTime()) / (1000 * 3600 * 24);
      console.log('Selected Stay:', {
        roomId: this.selectedRoomId,
        arrivalDate: this.selectedArrivalDate,
        departureDate: this.selectedDepartureDate,
        duration: stayDuration,
      });
    }

    this.dragging = false;
    this.selectedArrivalDate = null;
    this.selectedDepartureDate = null;
    this.selectedRoomId = null;
  }

  getTooltipForCell(roomId: number, dayObj: DayObj): string {
    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
    currentDay.setHours(12, 0, 0, 0);

    const reservation = this.reservations.find((res) => {
      const reservationStartDate = new Date(res.arrivalDate);
      reservationStartDate.setHours(11, 0, 0, 0);

      return (
        res.roomId === roomId &&
        reservationStartDate.toDateString() === currentDay.toDateString()
      );
    });

    if (reservation) {
      const customer = this.customers.find(cust => cust.customerId === reservation.customerId);
      if (customer) {
        return `Customer: ${customer.firstName} ${customer.lastName}\nArrival: ${reservation.arrivalDate}\nDeparture: ${reservation.departureDate}\nAmount Paid: ${reservation.paidAmount}`;
      }
    }

    return '';
  }

  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  initializeTooltips(): void {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
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
