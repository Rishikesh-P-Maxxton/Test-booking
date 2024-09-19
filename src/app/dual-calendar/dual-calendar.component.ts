import { Component, OnInit } from '@angular/core';
import { RoomService } from '../services/room.service';
import { StayService } from '../services/stays.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation } from '../Interfaces/reservation';

@Component({
  selector: 'app-dual-calendar',
  templateUrl: './dual-calendar.component.html',
  styleUrls: ['./dual-calendar.component.css']
})
export class DualCalendarComponent implements OnInit {
  currentMonth: number;
  nextMonth: number;
  currentYear: number;
  nextYear: number;
  daysInCurrentMonth: { day: number, fromPreviousMonth: boolean }[] = [];
  daysInNextMonth: { day: number, fromPreviousMonth: boolean }[] = [];
  selectedArrivalDate: Date | null = null;
  selectedDepartureDate: Date | null = null;
  today: Date = new Date();
  rooms: Room[] = []; // Array of rooms with stays
  validDepartureDates: Date[] = []; // Combined valid departure dates after arrival selection

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private reservationStorageService: ReservationStorageService
  ) {
    this.currentYear = this.today.getFullYear();
    this.nextYear = this.today.getFullYear();
    this.currentMonth = this.today.getMonth() + 1; // Current month (1-12)
    this.nextMonth = this.currentMonth === 12 ? 1 : this.currentMonth + 1; // Next month
    if (this.currentMonth === 12) {
      this.nextYear += 1; // Handle year increment for next month
    }
  }

  ngOnInit(): void {
    this.generateCalendarDays();
    this.initializeRoomsAndStays();
  }

  // Fetch and initialize rooms and stays
  initializeRoomsAndStays(): void {
    this.roomService.getRooms().subscribe(rooms => {
      this.stayService.getStays().subscribe(stays => {
        this.rooms = rooms.map(room => ({
          ...room,
          stays: stays.filter(stay => stay.roomId === room.roomId).map(stay => ({
            ...stay,
            stayDateFrom: new Date(stay.stayDateFrom), // Convert string to Date
            stayDateTo: new Date(stay.stayDateTo) // Convert string to Date
          }))
        }));
        console.log('Rooms and Stays Initialized:', this.rooms);
      });
    });
  }

  // Generate calendar days for both months
  generateCalendarDays(): void {
    this.daysInCurrentMonth = this.generateDaysForMonth(this.currentMonth, this.currentYear);
    this.daysInNextMonth = this.generateDaysForMonth(this.nextMonth, this.nextYear);
  }

  // Generates the array of days for the month, including empty cells for days before the first of the month
  generateDaysForMonth(month: number, year: number): { day: number, fromPreviousMonth: boolean }[] {
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const emptyDays = Array.from({ length: firstDayOfMonth }, () => ({ day: 0, fromPreviousMonth: true }));
    const currentMonthDays = Array.from({ length: totalDays }, (_, i) => ({ day: i + 1, fromPreviousMonth: false }));
    return [...emptyDays, ...currentMonthDays];
  }

  // Handle month navigation, adjusting year if needed
  nextMonthClick(): void {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear += 1;
    } else {
      this.currentMonth += 1;
    }

    if (this.nextMonth === 12) {
      this.nextMonth = 1;
      this.nextYear += 1;
    } else {
      this.nextMonth += 1;
    }

    this.generateCalendarDays();
  }

  previousMonthClick(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear -= 1;
    } else {
      this.currentMonth -= 1;
    }

    if (this.nextMonth === 1) {
      this.nextMonth = 12;
      this.nextYear -= 1;
    } else {
      this.nextMonth -= 1;
    }

    this.generateCalendarDays();
  }

  generateArrivalDates(stay: Stay): Set<string> {
    const arrivalDates = new Set<string>();
  
    // Ensure stay has valid booking range and arrival days
    if (!stay.arrivalDays || stay.arrivalDays.length === 0) {
      console.log(`Room ${stay.roomId}: No valid arrival days defined.`);
      return arrivalDates;
    }
  
    const today = new Date();
    const bookDateFrom = stay.bookDateFrom ? new Date(stay.bookDateFrom) : today;
    const bookDateTo = stay.bookDateTo ? new Date(stay.bookDateTo) : null;
  
    // Calculate the min and max allowable arrival dates based on deviation
    const minDeviation = stay.minDeviation ?? 0; // Handle missing minDeviation
    const maxDeviation = stay.maxDeviation ?? Infinity; // Handle missing maxDeviation
  
    const minDate = new Date(today.getTime() + minDeviation * 24 * 60 * 60 * 1000); // minDeviation in days
    const maxDate = new Date(today.getTime() + maxDeviation * 24 * 60 * 60 * 1000); // maxDeviation in days
  
    // Clamp the dates within the booking window
    const effectiveMinDate = minDate < bookDateFrom ? bookDateFrom : minDate;
    let effectiveMaxDate = maxDate;
  
    // Adjust max date if booking window has a limit (bookDateTo is defined)
    if (bookDateTo) {
      effectiveMaxDate = new Date(Math.min(maxDate.getTime(), bookDateTo.getTime()));
    }
  
    // Ensure effectiveMaxDate is not before effectiveMinDate
    if (effectiveMaxDate < effectiveMinDate) {
      console.log(`Room ${stay.roomId}: Invalid date range. No valid arrival dates.`);
      return arrivalDates;
    }
  
    console.log(`Room ${stay.roomId}: Generating valid arrival dates between ${effectiveMinDate.toDateString()} and ${effectiveMaxDate.toDateString()}`);
  
    // Helper function to get the day of the week
    const getDayOfWeek = (date: Date): string => {
      const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      return daysOfWeek[date.getDay()];
    };
  
    // Generate valid arrival dates within the effective date range
    for (let date = new Date(effectiveMinDate); date <= effectiveMaxDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = getDayOfWeek(date);
      if (stay.arrivalDays.includes(dayOfWeek)) {
        const formattedDate = date.toISOString().split('T')[0];
        arrivalDates.add(formattedDate);
        console.log(`Room ${stay.roomId}: Adding valid arrival date: ${formattedDate} (${dayOfWeek})`);
      } else {
        console.log(`Room ${stay.roomId}: Skipped ${date.toDateString()} (${dayOfWeek}) - Not a valid arrival day.`);
      }
    }
  
    return arrivalDates;
  }
  
  
  
  generateCombinedArrivalDates(): Set<string> {
    const combinedDates = new Set<string>();
  
    console.log(`\n\n=== Generating Combined Arrival Dates for All Rooms ===`);
  
    this.rooms.forEach(room => {
      room.stays.forEach(stay => {
        console.log(`\n--- Processing stays for Room ${stay.roomId} ---`);
        const stayDates = this.generateArrivalDates(stay);
        stayDates.forEach(date => {
          combinedDates.add(date);
        });
      });
    });
  
    console.log('\n=== Final Combined Arrival Dates ===');
    console.log(Array.from(combinedDates));
    console.log('====================================\n');
  
    return combinedDates;
  }
  
  

  
  
  

  departureDateFilter = (date: Date | null): boolean => {
    if (!date) return false;
  
    const arrivalDate = this.selectedArrivalDate; // Use the selected arrival date
    if (!arrivalDate || date <= arrivalDate) return false; // Departure date must be after the arrival date
  
    const validDepartureDates = new Set<string>();
  
    this.rooms.forEach(room => {
      room.stays.forEach(stay => {
        if (stay.stayDateFrom && stay.stayDateTo) {
          const stayDateFrom = new Date(stay.stayDateFrom);
          const stayDateTo = new Date(stay.stayDateTo);
  
          const minStay = stay.minStay || 0;
          const maxStay = stay.maxStay || Infinity;
  
          // Calculate the min and max possible departure dates
          const minDepartureDate = new Date(arrivalDate);
          minDepartureDate.setDate(arrivalDate.getDate() + minStay);
  
          const maxDepartureDate = new Date(arrivalDate);
          maxDepartureDate.setDate(arrivalDate.getDate() + maxStay);
  
          // Clamp the departure dates to the stay date range
          const effectiveMinDepartureDate = minDepartureDate < stayDateFrom ? stayDateFrom : minDepartureDate;
          const effectiveMaxDepartureDate = maxDepartureDate > stayDateTo ? stayDateTo : maxDepartureDate;
  
          // Helper function to get the day of the week
          const getDayOfWeek = (date: Date): string => {
            const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            return daysOfWeek[date.getDay()].toUpperCase();
          };
  
          // Add valid departure dates respecting `departureDays`
          for (let currentDate = new Date(effectiveMinDepartureDate); currentDate <= effectiveMaxDepartureDate; currentDate.setDate(currentDate.getDate() + 1)) {
            const dayOfWeek = getDayOfWeek(currentDate);
            if (stay.departureDays.includes(dayOfWeek)) {
              validDepartureDates.add(currentDate.toISOString().split('T')[0]);
            }
          }
        }
      });
    });
  
    const formattedDate = date.toISOString().split('T')[0];
    return validDepartureDates.has(formattedDate);
  }
  
  
  // Select arrival or departure date
  selectDate(day: number, month: number, year: number): void {
    const selectedDate = new Date(year, month - 1, day);

    // If no arrival date is selected, set this as the arrival date
    if (!this.selectedArrivalDate) {
      this.selectedArrivalDate = selectedDate;
      this.selectedArrivalDate.setHours(11, 0, 0, 0); // Set arrival time to 11:00 AM

      console.log('Selected Arrival Date:', this.formatDate(this.selectedArrivalDate));

      // Calculate valid departure dates after selecting an arrival date
      this.validDepartureDates = this.calculateValidDepartureDatesForArrival(this.selectedArrivalDate);

      console.log('Valid Departure Dates:', this.validDepartureDates.map(date => this.formatDate(date)));

    } else if (this.selectedArrivalDate && selectedDate > this.selectedArrivalDate) {
      // If the arrival date is already selected, pick this as the departure date
      this.selectedDepartureDate = selectedDate;
      this.selectedDepartureDate.setHours(10, 0, 0, 0); // Set departure time to 10:00 AM

      console.log('Selected Departure Date:', this.formatDate(this.selectedDepartureDate));
    }

    this.generateCalendarDays(); // Re-render the calendar after selection
  }

  calculateValidDepartureDatesForArrival(arrivalDate: Date): Date[] {
    const validDepartureDates: Date[] = [];
    
    this.rooms.forEach(room => {
      room.stays.forEach(stay => {
        // Ensure the stay allows the selected arrival date
        if (this.isValidArrivalDate(arrivalDate, stay)) {
          
          // Get valid departure dates for this specific stay
          const departureDates = this.calculateValidDepartureDates(arrivalDate, stay);
  
          // Filter out dates that conflict with reservations for the room
          const unreservedDates = this.filterOutReservedDates(departureDates, room.roomId);
  
          // Add valid, unreserved departure dates for this stay
          validDepartureDates.push(...unreservedDates);
        }
      });
    });
  
    // Remove duplicates (in case multiple stays share some valid departure dates)
    return Array.from(new Set(validDepartureDates.map(date => date.getTime())))
                .map(time => new Date(time));
  }
  
  
  filterStaysByArrivalDate(arrivalDate: Date): Stay[] {
    return this.rooms.reduce((filteredStays: Stay[], room: Room) => {
      const validStays = room.stays.filter(stay => {
        // Convert stayDateFrom and stayDateTo to Date objects only for comparison
        const stayDateFrom = new Date(stay.stayDateFrom);
        const stayDateTo = new Date(stay.stayDateTo);
  
        // Check if the arrival date is valid for this stay using Date objects
        return this.isValidArrivalDate(arrivalDate, stay);
      });
  
      return [...filteredStays, ...validStays]; // Accumulate valid stays
    }, []); // Initial accumulator is an empty array
  }
  
  
  
  
  
  


  // Check if the arrival date is valid based on stay's arrival days and stay range
  isValidArrivalDate(arrivalDate: Date, stay: Stay): boolean {
    const stayDateFrom = stay.stayDateFrom ? new Date(stay.stayDateFrom) : null;
    const stayDateTo = stay.stayDateTo ? new Date(stay.stayDateTo) : null;
  
    if (!stayDateFrom || !stayDateTo) {
      console.log(`Stay dates are missing for room ${stay.roomId}`);
      return false;
    }
  
    const arrivalDay = this.getDayOfWeek(arrivalDate); // Get the arrival day (e.g., MON)
    
    // Check if the arrivalDate is within the stay's range and on a valid arrival day
    return (
      this.isDateWithinRange(arrivalDate, stayDateFrom, stayDateTo) &&
      stay.arrivalDays.includes(arrivalDay)
    );
  }
  
  

  // Calculate valid departure dates based on minStay, maxStay, and stay range
  calculateValidDepartureDates(arrivalDate: Date, stay: Stay): Date[] {
    const validDates: Date[] = [];
    const minStay = stay.minStay ?? 1; // Default to 1 night if minStay is missing
    const maxStay = stay.maxStay ?? 30; // Default to a reasonable maximum stay if maxStay is missing
  
    // Loop from minStay to maxStay to calculate potential departure dates
    for (let i = minStay; i <= maxStay; i++) {
      const candidateDepartureDate = new Date(arrivalDate);
      candidateDepartureDate.setDate(arrivalDate.getDate() + i); // Calculate departure date based on stay length
  
      // Ensure the departure date falls within the stay period (stayDateFrom to stayDateTo)
      if (candidateDepartureDate <= new Date(stay.stayDateTo) && candidateDepartureDate >= new Date(stay.stayDateFrom)) {
        // Also check if it is a valid departure day (e.g., SAT)
        if (this.isValidDepartureDay(candidateDepartureDate, stay)) {
          validDates.push(candidateDepartureDate);
        }
      }
    }
    
    return validDates; // Return valid dates within the stay period
  }
  
  
  
  

  // Helper method to check if the date is a valid departure day (e.g., Saturday)
  isValidDepartureDay(date: Date, stay: Stay): boolean {
    const dayOfWeek = this.getDayOfWeek(date); // Get day as MON, TUE, etc.
    return stay.departureDays.includes(dayOfWeek); // Check if the departure day is valid
  }

  

  // Filter out reserved dates for a given room
  filterOutReservedDates(validDates: Date[], roomId: number): Date[] {
    const reservations = this.reservationStorageService.getReservations()
      .filter(res => res.reservation.roomId === roomId)
      .map(res => ({
        arrivalDate: res.reservation.arrivalDate ? new Date(res.reservation.arrivalDate) : null,
        departureDate: res.reservation.departureDate ? new Date(res.reservation.departureDate) : null
      }))
      .filter(res => res.arrivalDate && res.departureDate); // Filter out reservations where either date is null
  
    // Filter out dates that overlap with any reservation for the room
    return validDates.filter(date => {
      return !reservations.some(reservation => {
        // Ensure both arrivalDate and departureDate are valid
        if (reservation.arrivalDate && reservation.departureDate) {
          return this.isDateWithinRange(date, reservation.arrivalDate, reservation.departureDate);
        }
        return false;
      });
    });
  }
  
  
  
  

  // Helper: Check if a date is within a date range
  isDateWithinRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
  }

  // Helper: Get the day of the week (e.g., MON, TUE)
  getDayOfWeek(date: Date): string {
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return daysOfWeek[date.getDay()];
  }
  
  // Helper: Get formatted display date
  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  // Helper: Get formatted display date in "19 September 2024" format
formatDate2(date: Date): string {
  const day = date.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[date.getMonth()]; // Get full month name
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}


  getCellClass(dayObj: { day: number, fromPreviousMonth: boolean }, month: number, year: number): string {
    const date = new Date(year, month - 1, dayObj.day);
  
    // Skip empty cells
    if (dayObj.fromPreviousMonth || dayObj.day === 0) {
      console.log(`Date ${date.toDateString()}: Skipped - from previous month or empty cell.`);
      return 'empty-cell';
    }
  
    // Disable past dates
    if (date < this.today) {
      console.log(`Date ${date.toDateString()}: Disabled - in the past.`);
      return 'disabled';
    }
  
    // If no arrival date is selected, enable only valid arrival dates
    if (!this.selectedArrivalDate) {
      const validArrivalDates = this.generateCombinedArrivalDates();
      const formattedDate = this.formatDateToYYYYMMDD(date);
      if (validArrivalDates.has(formattedDate)) {
        console.log(`Date ${date.toDateString()}: Valid arrival date.`);
        return 'valid-date';
      } else {
        console.log(`Date ${date.toDateString()}: Disabled - not a valid arrival date.`);
        return 'disabled';
      }
    }
  
    // Disable dates before the selected arrival date
    if (this.selectedArrivalDate && date < this.selectedArrivalDate) {
      console.log(`Date ${date.toDateString()}: Disabled - before selected arrival date.`);
      return 'disabled';
    }
  
    // Highlight the selected arrival date
    if (this.selectedArrivalDate && this.formatDateToYYYYMMDD(date) === this.formatDateToYYYYMMDD(this.selectedArrivalDate)) {
      console.log(`Date ${date.toDateString()}: Selected as arrival date.`);
      return 'selected-arrival';
    }
  
    // Check if the date is a valid departure date
    const isValidDeparture = this.isValidDateInRange(date); // Validate using formatted dates
    if (isValidDeparture) {
      console.log(`Date ${date.toDateString()}: Valid departure date.`);
      return 'valid-date';
    } else {
      console.log(`Date ${date.toDateString()}: Disabled - not a valid departure date.`);
      return 'disabled';
    }
  }
  
  
  
 
  

// Check if a date is in the valid range (for selectable dates)
isValidDateInRange(date: Date): boolean {
  const formattedDate = this.formatDateToYYYYMMDD(date); // Convert the date to 'yyyy-mm-dd' format
  const validDates = this.validDepartureDates.map(d => this.formatDateToYYYYMMDD(d)); // Convert valid dates to 'yyyy-mm-dd'
  
  const isValid = validDates.includes(formattedDate);
  console.log(`Checking if ${formattedDate} is a valid departure date: ${isValid}`);
  return isValid;
}

formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`; // Return formatted date as 'yyyy-mm-dd'
}








  // Reset both the selected dates and clear the display
  resetSelection(): void {
    this.selectedArrivalDate = null;
    this.selectedDepartureDate = null;
    this.validDepartureDates = [];
    this.generateCalendarDays(); // Re-render the calendar
  }

  // Helper: Calculate night stays between arrival and departure dates
  calculateNightStay(arrivalDate: Date | null, departureDate: Date | null): number {
    if (arrivalDate && departureDate) {
      const checkInDate = new Date(arrivalDate);
      checkInDate.setHours(11, 0, 0, 0); // Set check-in time to 11:00 AM

      const checkOutDate = new Date(departureDate);
      checkOutDate.setHours(10, 0, 0, 0); // Set check-out time to 10:00 AM

      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const nights = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days
      return Math.ceil(nights); // Return total nights
    }
    return 0;
  }

  // Save the selection with dates and night stays
  saveSelection(): void {
    if (this.selectedArrivalDate && this.selectedDepartureDate) {
      console.log('Arrival Date (11:00 AM):', this.formatDate(this.selectedArrivalDate));
      console.log('Departure Date (10:00 AM):', this.formatDate(this.selectedDepartureDate));
      const nights = this.calculateNightStay(this.selectedArrivalDate, this.selectedDepartureDate);
      console.log('Total Nights:', nights);
    } else {
      console.log('Please select both arrival and departure dates.');
    }
  }

  // Helper to get the month name
  getMonthName(month: number): string {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[month - 1];
  }
}
