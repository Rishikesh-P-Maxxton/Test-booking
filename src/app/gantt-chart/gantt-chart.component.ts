import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-gantt-chart',
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss']
})
export class GanttChartComponent implements AfterViewInit {
  // Sample data for Gantt chart
  rooms = [
    {
      roomId: 1,
      roomName: 'Ocean View Suite',
      guestCapacity: 4,
      pricePerDayPerPerson: 1200,
      availability: [
        { from: new Date('2024-08-01'), to: new Date('2024-10-31') }
      ]
    },
    {
      roomId: 2,
      roomName: 'Garden Room',
      guestCapacity: 2,
      pricePerDayPerPerson: 800,
      availability: [
        { from: new Date('2024-08-05'), to: new Date('2024-10-30') },
        { from: new Date('2024-08-01'), to: new Date('2024-10-31') }
      ]
    },
    {
      roomId: 3,
      roomName: 'Deluxe Villa',
      guestCapacity: 6,
      pricePerDayPerPerson: 1500,
      availability: [
        { from: new Date('2024-08-10'), to: new Date('2024-10-28') }
      ]
    },
    {
      roomId: 4,
      roomName: 'Beachfront Bungalow',
      guestCapacity: 4,
      pricePerDayPerPerson: 2000,
      availability: [
        { from: new Date('2024-08-15'), to: new Date('2024-10-25') },
        { from: new Date('2024-08-05'), to: new Date('2024-10-28') }
      ]
    },
    // Add more rooms as needed
  ];

  // Helper method to get the minimum and maximum dates for the X-axis
  getDateRange() {
    const allDates = this.rooms.flatMap(room =>
      room.availability.flatMap(period => [period.from, period.to])
    );
    const minDate = new Date(Math.min(...allDates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(date => date.getTime())));
    return { minDate, maxDate };
  }

  // Generate an array of dates for the X-axis
  getDatesArray() {
    const { minDate, maxDate } = this.getDateRange();
    const dates = [];
    let currentDate = minDate;

    while (currentDate <= maxDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Method to calculate bar styles based on availability
  getBarStyle(period: { from: Date; to: Date; }) {
    const datesArray = this.getDatesArray();
    const startIndex = datesArray.findIndex(date => date >= period.from);
    const endIndex = datesArray.findIndex(date => date > period.to);

    return {
      gridColumnStart: startIndex + 2, // +2 because of the label column
      gridColumnEnd: endIndex + 2,
      backgroundColor: '#007bff',
      animation: 'fadeIn 1s ease-out'
    };
  }

  // Generate tooltip data for each period
  getTooltipData(room: { availability: any[]; pricePerDayPerPerson: any; guestCapacity: any; }) {
    return room.availability.map(period => {
      const startDate = period.from.toDateString();
      const endDate = period.to.toDateString();
      return `Available from ${startDate} to ${endDate}<br>Price per day: $${room.pricePerDayPerPerson}<br>Capacity: ${room.guestCapacity} guests`;
    }).join('<br><br>');
  }

  ngAfterViewInit() {
    // Initialize any additional animations or interactions here if needed
  }
}
