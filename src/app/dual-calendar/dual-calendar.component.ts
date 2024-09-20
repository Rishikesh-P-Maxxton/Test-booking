import { Component, OnInit } from '@angular/core';
import { RoomService } from '../services/room.service';
import { StayService } from '../services/stays.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation } from '../Interfaces/reservation';
import { CalendarRoom } from '../Interfaces/calendar-room';

export interface SimplifiedReservation {
  roomId: number;
  arrivalDate: string; // "YYYY-MM-DD"
  departureDate: string; // "YYYY-MM-DD"
}
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

 // Generate valid arrival dates for a specific stay
 generateArrivalDates(stay: Stay): Set<string> {
  const arrivalDates = new Set<string>();

  // If arrivalDays are missing, allow all days as valid arrival days
  if (!stay.arrivalDays || stay.arrivalDays.length === 0) {
    console.log(`Room ${stay.roomId}: No valid arrival days defined, allowing all days as valid.`);
    stay.arrivalDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]; // Default to all days
  }

  const today = new Date();
  const bookDateFrom = stay.bookDateFrom ? new Date(stay.bookDateFrom) : today; 
  const bookDateTo = stay.bookDateTo ? new Date(stay.bookDateTo) : null;

  const minDeviation = stay.minDeviation ?? 0; 
  const maxDeviation = stay.maxDeviation ?? Infinity;

  const minDate = new Date(today.getTime() + minDeviation * 24 * 60 * 60 * 1000);
  const maxDate = new Date(today.getTime() + maxDeviation * 24 * 60 * 60 * 1000);

  // Clamp the dates within the booking window
  const effectiveMinDate = minDate < bookDateFrom ? bookDateFrom : minDate;
  let effectiveMaxDate = maxDate;
  if (bookDateTo) {
    effectiveMaxDate = new Date(Math.min(maxDate.getTime(), bookDateTo.getTime()));
  }

  if (effectiveMaxDate < effectiveMinDate) {
    
    return arrivalDates;
  }

  // Generate valid arrival dates within the effective date range
  for (let date = new Date(effectiveMinDate); date <= effectiveMaxDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = this.getDayOfWeek(date);
    if (stay.arrivalDays.includes(dayOfWeek)) {
      const formattedDate = date.toISOString().split('T')[0];
      arrivalDates.add(formattedDate);
    }
  }

  return arrivalDates;
}



// Combine arrival dates from all rooms and stays
generateCombinedArrivalDates(): Set<string> {
  const combinedDates = new Set<string>();

  console.log(`\n\n=== Generating Combined Arrival Dates for All Rooms ===`);

  this.rooms.forEach(room => {
    room.stays.forEach(stay => {
      
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
  
      // Calculate valid departure dates and map after selecting an arrival date
      const { validDepartureDates, validDepartureMap } = this.calculateValidDepartureDatesForArrival(this.selectedArrivalDate);
  
      // Assign the valid departure dates array to the class property
      this.validDepartureDates = validDepartureDates;
      console.log('Valid Departure Map:', validDepartureMap); // Log the valid departure map for debugging
  
      // Store the valid departure map for future use
      this.validDepartureMap = validDepartureMap;
  
      console.log('Valid Departure Dates:', this.validDepartureDates.map(date => this.formatDate(date)));
  
    } else if (this.selectedArrivalDate && selectedDate > this.selectedArrivalDate) {
      // If the arrival date is already selected, pick this as the departure date
      this.selectedDepartureDate = selectedDate;
      this.selectedDepartureDate.setHours(10, 0, 0, 0); // Set departure time to 10:00 AM
  
      console.log('Selected Departure Date:', this.formatDate(this.selectedDepartureDate));
    }
  
    this.generateCalendarDays(); // Re-render the calendar after selection
  }
  
  

  validDepartureMap: Map<string, Map<number, Stay[]>> = new Map(); // departure date => (roomId => [stays])

  calculateValidDepartureDatesForArrival(arrivalDate: Date): {
    validDepartureDates: Date[],
    validDepartureMap: Map<string, Map<number, Stay[]>>
  } {
    const validDepartureDates: Date[] = [];
    const validDepartureMap: Map<string, Map<number, Stay[]>> = new Map<string, Map<number, Stay[]>>();
  
    // Go through each room and its stays
    this.rooms.forEach(room => {
      room.stays.forEach(stay => {
        // Ensure the stay allows the selected arrival date
        if (this.isValidArrivalDate(arrivalDate, stay)) {
          // Calculate the base valid departure dates for this specific stay
          const departureDates = this.calculateValidDepartureDates(arrivalDate, stay);
  
          // Filter the valid departure dates using the `filterOutReservedDates` function
          const filteredDepartureDates = this.filterOutReservedDates(departureDates, stay.roomId);
  
          // For each valid and filtered departure date
          filteredDepartureDates.forEach(departureDate => {
            // Format departureDate to a string 'yyyy-mm-dd'
            const formattedDepartureDate = this.formatDateToYYYYMMDD(departureDate);
  
            // Retrieve or initialize the map for this departure date
            let staysForDate: Map<number, Stay[]> = validDepartureMap.get(formattedDepartureDate) || new Map<number, Stay[]>();
  
            // Retrieve or initialize the array of stays for this room
            const staysForRoom: Stay[] = staysForDate.get(room.roomId) || [];
  
            // Add the current stay to the array for this room
            staysForRoom.push(stay);
  
            // Update the map with the array of stays for this room
            staysForDate.set(room.roomId, staysForRoom);
  
            // Update the outer map with the stays map for this departure date
            validDepartureMap.set(formattedDepartureDate, staysForDate);
  
            // Add the departure date to the valid dates array
            validDepartureDates.push(departureDate);
  
            // Log for debugging
            console.log(`Valid Departure date: ${this.formatDate(departureDate)}, Room: ${room.roomId}`);
          });
        }
      });
    });
  
    // Remove duplicates from validDepartureDates
    const uniqueDepartureDates = Array.from(new Set(validDepartureDates.map(date => date.getTime()))).map(time => new Date(time));
  
    // Return the departure dates and map
    return {
      validDepartureDates: uniqueDepartureDates,
      validDepartureMap: validDepartureMap
    };
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
    // Convert stayDateFrom and stayDateTo to Date objects if they are strings
    const stayDateFrom = new Date(stay.stayDateFrom);
    const stayDateTo = new Date(stay.stayDateTo);
    
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
  
    // Simplified reservations for this room
    const reservations: SimplifiedReservation[] = this.getRoomReservations(stay.roomId);
  
    const stayDateFrom = new Date(stay.stayDateFrom);
    const stayDateTo = new Date(stay.stayDateTo);
  
    if (!stay.departureDays || stay.departureDays.length === 0) {
      stay.departureDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]; // Default to all days
    }
  
    for (let i = stay.minStay; i <= stay.maxStay; i++) {
      const candidateDepartureDate = new Date(arrivalDate);
      candidateDepartureDate.setDate(arrivalDate.getDate() + i);
  
      if (candidateDepartureDate <= stayDateTo && candidateDepartureDate >= stayDateFrom) {
        if (this.isValidDepartureDay(candidateDepartureDate, stay)) {
          validDates.push(candidateDepartureDate);
        }
      }
    }
  
    // Apply filtering for reservations that conflict with the valid departure dates
    return this.filterOutReservedDates(validDates, stay.roomId);
  }
  
  
  
  
  // Helper function to get room reservations from the reservation storage
  getRoomReservations(roomId: number): SimplifiedReservation[] {
    const simplifiedReservations: SimplifiedReservation[] = this.reservationStorageService.getReservations()
      .filter(res => res.reservation.roomId === roomId)
      .map(res => ({
        roomId: res.reservation.roomId,
        arrivalDate: new Date(res.reservation.arrivalDate).toISOString().split('T')[0], // Ensure valid date format (YYYY-MM-DD)
        departureDate: new Date(res.reservation.departureDate).toISOString().split('T')[0] // Ensure valid date format (YYYY-MM-DD)
      }));
  
    console.log(`Reservations for Room ${roomId}:`, simplifiedReservations);
    return simplifiedReservations;
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
      arrivalDate: new Date(res.reservation.arrivalDate),
      departureDate: new Date(res.reservation.departureDate)
    }));

  return validDates.filter(date => {
    return !reservations.some(reservation => {
      const checkOutTime = 10 * 60 * 60 * 1000;  // 10:00 AM in milliseconds
      const checkInTime = 11 * 60 * 60 * 1000;   // 11:00 AM in milliseconds

      const reservationStart = new Date(reservation.arrivalDate.getTime() - checkInTime); // Reservation start
      const reservationEnd = new Date(reservation.departureDate.getTime() + checkOutTime); // Reservation end

      // Case 1: Overlap check (already handled)
      if (date >= reservationStart && date <= reservationEnd) {
        console.log(`Date ${date.toDateString()} overlaps with a reservation (from ${reservation.arrivalDate.toDateString()} to ${reservation.departureDate.toDateString()}).`);
        return true;  // This date overlaps with the reservation, so it's invalid.
      }

      // Case 2: Engulfing check (new)
      // Ensure the selected arrival date + departure date doesn't engulf the reservation.
      // Engulfing: Arrival is before the reservation start and departure is after the reservation end.
      if (this.selectedArrivalDate && this.selectedArrivalDate < reservation.arrivalDate && date > reservation.departureDate) {
        console.log(`Date ${date.toDateString()} engulfs a reservation (from ${reservation.arrivalDate.toDateString()} to ${reservation.departureDate.toDateString()}).`);
        return true;  // This date engulfs the reservation, so it's invalid.
      }
      if (this.selectedArrivalDate && this.selectedArrivalDate > reservation.arrivalDate && this.selectedArrivalDate<=reservation.departureDate && date > reservation.departureDate) {
        console.log(`Date ${date.toDateString()} engulfs a reservation (from ${reservation.arrivalDate.toDateString()} to ${reservation.departureDate.toDateString()}).`);
        return true;  // This date engulfs the reservation, so it's invalid.
      }

      // Case 3: Same-day check-in/out allowed (still valid)
      if (date.getTime() === reservation.arrivalDate.getTime()) {
        console.log(`Date ${date.toDateString()} is valid for same-day check-out and check-in.`);
        return false;  // This date is valid.
      }

      return false;  // If none of the conditions apply, the date is valid.
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
  const formattedDate = this.formatDateToYYYYMMDD(date);

  // Skip empty cells
  if (dayObj.fromPreviousMonth || dayObj.day === 0) {
      return 'empty-cell';
  }

  // Disable past dates
  if (date < this.today) {
      return 'disabled';
  }

  // Check if the date is the selected arrival date
  if (this.selectedArrivalDate && formattedDate === this.formatDateToYYYYMMDD(this.selectedArrivalDate)) {
      return 'selected-arrival';
  }

  // Check if the date is the selected departure date
  if (this.selectedDepartureDate && formattedDate === this.formatDateToYYYYMMDD(this.selectedDepartureDate)) {
      return 'selected-departure';
  }

  // If the date is between the selected arrival and departure dates, highlight the range
  if (this.selectedArrivalDate && this.selectedDepartureDate && date > this.selectedArrivalDate && date < this.selectedDepartureDate) {
      return 'selected-range';
  }

 // If no arrival date is selected, show valid arrival dates only
if (!this.selectedArrivalDate) {
  const validArrivalDates = this.generateCombinedArrivalDates();
  if (validArrivalDates.has(formattedDate)) {
      return 'valid-date';  // Dates are valid even if there are no arrivalDays
  }
  return 'disabled';
}

  // Check if the date is a valid departure date (only after selecting the arrival date)
  const isValidDeparture = this.isValidDateInRange(date);
  if (isValidDeparture) {
      return 'valid-date';
  }

  // If it's none of the above, disable the date
  return 'disabled';
}


  
  
  
 
  

// Check if a date is in the valid range (for selectable dates)
isValidDateInRange(date: Date): boolean {
  const formattedDate = this.formatDateToYYYYMMDD(date); // Convert the date to 'yyyy-mm-dd' format
  const validDates = this.validDepartureDates.map(d => this.formatDateToYYYYMMDD(d)); // Convert valid dates to 'yyyy-mm-dd'
  
  const isValid = validDates.includes(formattedDate);
  
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
      const selectedArrivalDateStr = this.formatDateToYYYYMMDD(this.selectedArrivalDate);
      const selectedDepartureDateStr = this.formatDateToYYYYMMDD(this.selectedDepartureDate);
    
      console.log('Selected Arrival Date:', selectedArrivalDateStr);
      console.log('Selected Departure Date:', selectedDepartureDateStr);
    
      // Check if the selected departure date exists in the validDepartureMap
      if (this.validDepartureMap.has(selectedDepartureDateStr)) {
        const staysForDeparture = this.validDepartureMap.get(selectedDepartureDateStr);
        const filteredRooms: CalendarRoom[] = [];
  
        // Iterate over stays for the selected departure date
        staysForDeparture?.forEach((stays, roomId) => {
          // Log which room we are checking stays for
          console.log(`Checking Room ID: ${roomId}, Stays:`, stays);
  
          // Filter stays that match the selected arrival date
          const matchingStay = stays.find(stay => {
            const stayArrivalDateStr = this.formatDateToYYYYMMDD(new Date(stay.stayDateFrom));
            console.log(`Checking Stay with Arrival Date: ${stayArrivalDateStr}`);
            return stayArrivalDateStr === selectedArrivalDateStr;
          });
  
          // If a matching stay is found, add the room with selectedStay to the filtered array
          if (matchingStay) {
            console.log(`Found matching stay for Room ID: ${roomId}, Stay:`, matchingStay);
            filteredRooms.push({
              roomId: roomId,
              locationId: this.rooms.find(room => room.roomId === roomId)?.locationId || 0,
              locationName: this.rooms.find(room => room.roomId === roomId)?.locationName || '',
              roomName: this.rooms.find(room => room.roomId === roomId)?.roomName || '',
              pricePerDayPerPerson: this.rooms.find(room => room.roomId === roomId)?.pricePerDayPerPerson || 0,
              guestCapacity: this.rooms.find(room => room.roomId === roomId)?.guestCapacity || 0,
              selectedStay: matchingStay
            });
          } else {
            console.log(`No matching stay found for Room ID: ${roomId} with Arrival Date: ${selectedArrivalDateStr}`);
          }
        });
  
        // Log the filtered rooms with their selected stays
        if (filteredRooms.length > 0) {
          console.log('Filtered Rooms with Selected Stay:', filteredRooms);
        } else {
          console.log('No matching rooms found for the selected criteria.');
        }
      } else {
        console.log('No matching stays found for the selected departure date.');
      }
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
