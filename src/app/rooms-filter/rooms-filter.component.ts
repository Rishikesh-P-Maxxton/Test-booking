import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { StayService } from '../stays.service';

@Component({
  selector: 'app-rooms-filter',
  templateUrl: './rooms-filter.component.html',
  styleUrl: './rooms-filter.component.css'
})
export class RoomsFilterComponent implements OnInit {
  rooms: any[] = [];
  stays: any[] = [];
  filteredRooms: any[] = [];
  filterForm: FormGroup;
  locations: string[] = [];

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      location: [''],
      dateRange: this.fb.group({
        from: [''],
        to: ['']
      }),
      numberOfPersons: [0],
      maxPrice: [0],
      minStay: [0],
      maxStay: [0]
    });
  }

  ngOnInit(): void {
    this.roomService.getRooms().subscribe(roomData => {
      this.rooms = roomData;
      this.stayService.getStays().subscribe(stayData => {
        this.stays = stayData;
        this.mergeData();
        this.initializeLocations();
      });
    });
  }

  mergeData(): void {
    this.filteredRooms = this.rooms.map(room => {
      const stay = this.stays.find(stay => stay.roomId === room.roomId);
      return { ...room, ...stay };
    });
  }

  initializeLocations(): void {
    const uniqueLocations = Array.from(new Set(this.rooms.map(room => room.locationName)));
    this.locations = uniqueLocations;
  }

  applyFilter(): void {
    const filters = this.filterForm.value;

    this.filteredRooms = this.rooms.map(room => {
      const stay = this.stays.find(stay => stay.roomId === room.roomId);
      return { ...room, ...stay };
    });

    this.filteredRooms = this.filteredRooms.filter(room => {
      const isLocationMatch = !filters.location || room.locationName.toLowerCase().includes(filters.location.toLowerCase());

      const isDateRangeMatch = (!filters.dateRange.from || new Date(room.stayDateFrom) >= new Date(filters.dateRange.from)) &&
                               (!filters.dateRange.to || new Date(room.stayDateTo) <= new Date(filters.dateRange.to));

      const isCapacityMatch = filters.numberOfPersons <= 0 || room.guestCapacity >= filters.numberOfPersons;

      const isPriceMatch = filters.maxPrice <= 0 || room.pricePerDayPerPerson <= filters.maxPrice;

      const isStayDurationMatch = (filters.minStay <= 0 || room.minStay <= filters.minStay) &&
                                  (filters.maxStay <= 0 || room.maxStay >= filters.maxStay);

      return isLocationMatch && isDateRangeMatch && isCapacityMatch && isPriceMatch && isStayDurationMatch;
    });
  }
}