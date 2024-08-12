import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';  // Import your Room service
import { StayService } from '../stays.service';  // Import your Stay service

declare const google: any;

@Component({
  selector: 'app-room-availability-chart',
  templateUrl: './room-availability-chart.component.html',
  styleUrls: ['./room-availability-chart.component.css']
})
export class RoomAvailabilityChartComponent implements OnInit {
  rooms: any[] = [];
  stays: any[] = [];

  constructor(private roomService: RoomService, private stayService: StayService) { }

  ngOnInit(): void {
    this.loadRoomData();
  }

  loadRoomData(): void {
    this.roomService.getRooms().subscribe(roomData => {
      this.rooms = roomData;
      this.stayService.getStays().subscribe(stayData => {
        this.stays = stayData;
        this.drawChart();
      });
    });
  }

  drawChart(): void {
    google.charts.load('current', { packages: ['gantt'] });
    google.charts.setOnLoadCallback(() => {
      const dataTable = new google.visualization.DataTable();
      dataTable.addColumn('string', 'Task ID');
      dataTable.addColumn('string', 'Task Name');
      dataTable.addColumn('date', 'Start Date');
      dataTable.addColumn('date', 'End Date');
      dataTable.addColumn('number', 'Duration');
      dataTable.addColumn('number', 'Percent Complete');
      dataTable.addColumn('string', 'Dependencies');
  
      const data = this.rooms.flatMap(room => {
        const roomStays = this.stays.filter(stay => stay.roomId === room.roomId);
        return roomStays.map(stay => [
          `Room ${room.roomId}`, 
          room.roomName,
          new Date(stay.stayDateFrom),
          new Date(stay.stayDateTo),
          null,
          100,  // Mark as 100% complete (for illustration)
          null
        ]);
      });
  
      dataTable.addRows(data);
  
      const chart = new google.visualization.Gantt(document.getElementById('availabilityChart') as HTMLElement);
      chart.draw(dataTable, {
        height: 800,
        width: '100%', // Make the chart responsive
        // Optionally, add some configuration to adjust scrolling behavior
      });
    });
  }
}
