import { Component, OnInit } from '@angular/core';

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
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  today: Date = new Date();
  arrivalDateDisplay: string = '';
  departureDateDisplay: string = '';

  selectedDays: Set<number> = new Set();  // Track selected days


  constructor() {
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
  }

  // Generate days for both months, including previous and next month "filler" days
  generateCalendarDays(): void {
    this.daysInCurrentMonth = this.generateDaysForMonth(this.currentMonth, this.currentYear);
    this.daysInNextMonth = this.generateDaysForMonth(this.nextMonth, this.nextYear);
  }

  // Generates the array of days for the month, including empty cells for days before the first of the month
  generateDaysForMonth(month: number, year: number): { day: number, fromPreviousMonth: boolean }[] {
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // Find the weekday of the 1st day of the month
    const totalDays = new Date(year, month, 0).getDate(); // Total days in the current month

    // Empty slots for previous days
    const emptyDays = Array.from({ length: firstDayOfMonth }, () => ({
      day: 0,
      fromPreviousMonth: true
    }));

    // Actual days in the current month
    const currentMonthDays = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      fromPreviousMonth: false
    }));

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

  // Select start or end date
  selectedArrivalDate: Date | null = null;  // Track the selected arrival date
  selectedDepartureDate: Date | null = null;  // Track the selected departure date

  selectDate(day: number, month: number, year: number): void {
    const selectedDate = new Date(year, month - 1, day);  // Create the selected date object
  
    // If no arrival date is selected, set this as the arrival date
    if (!this.selectedArrivalDate) {
      this.selectedArrivalDate = selectedDate;
      this.arrivalDateDisplay = this.formatDate(this.selectedArrivalDate);
      this.departureDateDisplay = ''; // Clear the departure date until it's selected
      console.log("Arrival date selected:", this.selectedArrivalDate);
    } 
    // If the arrival date is already selected, pick this as the departure date
    else {
      if (selectedDate > this.selectedArrivalDate) {
        this.selectedDepartureDate = selectedDate;  // Set the departure date
        this.departureDateDisplay = this.formatDate(this.selectedDepartureDate);  // Display departure date
  
        // Calculate the stay using the planning chart logic
        const stayDuration = this.calculateNightStay(this.selectedArrivalDate, this.selectedDepartureDate);
        console.log("Departure date selected:", this.selectedDepartureDate);
        console.log(`Total stay duration: ${stayDuration} nights`);
      }
    }
  }
  calculateNightStay(arrivalDate: Date, departureDate: Date): number {
    // Set check-in time for arrival day at 11:00 AM
    const checkInDate = new Date(arrivalDate);
    checkInDate.setHours(11, 0, 0, 0);  // 11:00 AM
  
    // Set check-out time for departure day at 10:00 AM
    const checkOutDate = new Date(departureDate);
    checkOutDate.setHours(10, 0, 0, 0);  // 10:00 AM
  
    // Calculate the difference in time (in milliseconds)
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  
    // Convert the time difference from milliseconds to days
    const daysDiff = timeDiff / (1000 * 3600 * 24);  // 1000 ms * 3600 s * 24 h
  
    // Return the number of nights (round up if partial day)
    return Math.ceil(daysDiff);
  }
  
  getCellClass(dayObj: { day: number, fromPreviousMonth: boolean }, month: number, year: number): string {
    // If the cell is from the previous month (empty cells at the start of the month)
    if (dayObj.fromPreviousMonth || dayObj.day === 0) {
      return 'empty-cell';  // Apply the empty-cell class to make it white and non-selectable
    }
  
    // If the date is disabled
    if (this.isDateDisabled(dayObj.day, month, year)) {
      return 'disabled';
    }
  
    // If this date is the arrival day
    if (this.selectedArrivalDate && new Date(year, month - 1, dayObj.day).getTime() === this.selectedArrivalDate.getTime()) {
      return 'selected-arrival';
    }
  
    // If this date is the departure day
    if (this.selectedDepartureDate && new Date(year, month - 1, dayObj.day).getTime() === this.selectedDepartureDate.getTime()) {
      return 'selected-departure';
    }
  
    // If this date is within the range between arrival and departure
    if (this.selectedArrivalDate && this.selectedDepartureDate &&
        new Date(year, month - 1, dayObj.day) > this.selectedArrivalDate &&
        new Date(year, month - 1, dayObj.day) < this.selectedDepartureDate) {
      return 'selected-range';
    }
  
    return '';  // Default case for regular cells
  }
  
  
  // Format the date for display in the input fields
  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Check if a day is selected
  isDateSelected(day: number, month: number, year: number): boolean {
    if (day === 0) return false; // Empty cell check

    const date = new Date(year, month - 1, day);

    const isStartDateSelected = this.selectedStartDate && date.getTime() === this.selectedStartDate.getTime();
    const isEndDateSelected = this.selectedEndDate && date.getTime() === this.selectedEndDate.getTime();

    return !!isStartDateSelected || !!isEndDateSelected;
  }

  // Check if a day is in the selected range
  isDateInRange(day: number, month: number, year: number): boolean {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;
    const date = new Date(year, month - 1, day);
    return date > this.selectedStartDate && date < this.selectedEndDate;
  }

  isDateDisabled(day: number, month: number, year: number): boolean {
    const selectedDate = new Date(year, month - 1, day);
  
    // Disable dates before the selected arrival date
    if (this.selectedArrivalDate && selectedDate < this.selectedArrivalDate) {
      return true;
    }
  
    // Optionally disable past dates (before today)
    if (selectedDate < this.today) {
      return true;
    }
  
    return false;  // Otherwise, the date is enabled
  }
  

  // Utility to get the name of the month
  getMonthName(month: number): string {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[month - 1];
  }
}
