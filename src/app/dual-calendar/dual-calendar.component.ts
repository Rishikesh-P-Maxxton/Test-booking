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
  selectDate(day: number, month: number, year: number, fromPreviousMonth: boolean): void {
    if (fromPreviousMonth) return; // Do not allow selection from previous or next months
    const selectedDate = new Date(year, month - 1, day);

    if (!this.selectedStartDate) {
      // Set the arrival date with check-in time at 11:00 AM
      this.selectedStartDate = new Date(year, month - 1, day, 11, 0, 0);
      this.arrivalDateDisplay = this.formatDate(this.selectedStartDate); // Update arrival display
      this.selectedEndDate = null; // Reset the end date
      this.departureDateDisplay = ''; // Clear the departure display
    } else if (!this.selectedEndDate) {
      if (selectedDate.getTime() === this.selectedStartDate.getTime()) {
        // Case 1: One-day booking -> set departure to the next day at 10:00 AM
        this.selectedEndDate = new Date(year, month - 1, day + 1, 10, 0, 0);
      } else {
        // Case 2: Multi-day booking -> set departure to 10:00 AM on the selected departure day
        this.selectedEndDate = new Date(year, month - 1, day, 10, 0, 0);
      }
      this.departureDateDisplay = this.formatDate(this.selectedEndDate); // Update departure display
    } else {
      // Reset the selection for a new booking
      this.selectedStartDate = new Date(year, month - 1, day, 11, 0, 0);
      this.arrivalDateDisplay = this.formatDate(this.selectedStartDate); // Update arrival display
      this.selectedEndDate = null;
      this.departureDateDisplay = ''; // Clear the departure display
    }
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

  // Disable dates before today
  isDateDisabled(day: number, month: number, year: number, fromPreviousMonth: boolean): boolean {
    if (fromPreviousMonth || day === 0) return true; // Disable previous or empty days
    const selectedDate = new Date(year, month - 1, day);
    return selectedDate < this.today;
  }

  // Utility to get the name of the month
  getMonthName(month: number): string {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[month - 1];
  }
}
