import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { StayService } from '../stays.service';
import { Stay } from '../Interfaces/stay';
import { Room } from '../Interfaces/room';




@Component({
  selector: 'app-rooms-filter',
  templateUrl: './rooms-filter.component.html',
  styleUrls: ['./rooms-filter.component.css']
})
export class RoomsFilterComponent implements OnInit {
  rooms: Room[] = [];
  stays: Stay[] = [];
  filteredRooms: Room[] = [];
  filterForm: FormGroup;
  locations: string[] = [];

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      location: [''],
      stayDateFrom: [''],
      stayDateTo: [''],
      numberOfPersons: [0],
      maxPrice: [0]
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
    const roomMap = new Map<number, Room>();

    this.rooms.forEach(room => {
      if (!roomMap.has(room.roomId)) {
        roomMap.set(room.roomId, { ...room, stays: [], availability: [] });
      }
    });

    this.stays.forEach(stay => {
      const room = roomMap.get(stay.roomId);
      if (room) {
        room.stays.push(stay);
        const availabilityDetail = `From: ${stay.stayDateFrom}, To: ${stay.stayDateTo}`;
        if (!room.availability.includes(availabilityDetail)) {
          room.availability.push(availabilityDetail);
        }
      }
    });

    this.filteredRooms = Array.from(roomMap.values());
    console.log('Merged Data:', this.filteredRooms); // Debugging line
  }

  initializeLocations(): void {
    const uniqueLocations = Array.from(new Set(this.rooms.map(room => room.locationName)));
    this.locations = uniqueLocations;
  }

  applyFilter(): void {
    const filters = this.filterForm.value;
    console.log('Filter Values:', filters); // Debugging line

    const arrivalDate = filters.stayDateFrom ? new Date(filters.stayDateFrom) : null;
    const departureDate = filters.stayDateTo ? new Date(filters.stayDateTo) : null;

    this.filteredRooms = this.rooms.map(room => {
      const stays = this.stays.filter(stay => stay.roomId === room.roomId);
      return { ...room, stays, availability: stays.map(stay => `From: ${stay.stayDateFrom}, To: ${stay.stayDateTo}`) };
    });

    this.filteredRooms = this.filteredRooms.filter(room => {
      const isLocationMatch = !filters.location || room.locationName.toLowerCase().includes(filters.location.toLowerCase());

      const isAvailabilityMatch = !arrivalDate || !departureDate || room.stays.some(stay => {
        const stayFrom = new Date(stay.stayDateFrom);
        const stayTo = new Date(stay.stayDateTo);

        const isDateOverlap = (stayFrom <= departureDate && stayTo >= arrivalDate);
        const stayDuration = (departureDate ? (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24) : 0);

        const isStayDurationMatch = (stayDuration <= 0 || (stayDuration >= stay.minStay && stayDuration <= stay.maxStay));

        return isDateOverlap && isStayDurationMatch;
      });

      const isCapacityMatch = filters.numberOfPersons <= 0 || room.guestCapacity >= filters.numberOfPersons;
      const isPriceMatch = filters.maxPrice <= 0 || room.pricePerDayPerPerson <= filters.maxPrice;

      return isLocationMatch && isAvailabilityMatch && isCapacityMatch && isPriceMatch;
    });

    console.log('Filtered Rooms:', this.filteredRooms); // Debugging line
  }
}
