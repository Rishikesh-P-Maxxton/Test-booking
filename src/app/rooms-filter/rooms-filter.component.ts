import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RoomService } from '../room.service';
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
  bookingForm: FormGroup;
  selectedRoom: Room | null = null;
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

    this.bookingForm = this.fb.group({
      reservationId: [''],
      roomNo: [''],
      stayDateFrom: [''],
      stayDateTo: [''],
      numberOfDays: [0],
      totalNumberOfGuests: [0],
      pricePerDayPerPerson: [0],
      totalPrice: [0]
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

  generateReservationId(): string {
    const prefix = 'RID';
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
    return `${prefix}${randomNumber}`;
  }

  mergeData(): void {
    const roomMap = new Map<number, Room>();

    this.rooms.forEach(room => {
      if (!roomMap.has(room.roomId)) {
        roomMap.set(room.roomId, { ...room, stays: [], availability: [] });    
      }
    });

    // this.stays.forEach(stay => {
    //   const room = roomMap.get(stay.roomId);
    //   if (room) {
    //     room.stays.push(stay);
    //     const availabilityDetail = `From: ${stay.stayDateFrom}, To: ${stay.stayDateTo}`;
    //     if (!room.availability.includes(availabilityDetail)) {
    //       room.availability.push(availabilityDetail);
    //     }
    //   }
    // });
    this.stays.forEach(stay => {
      const room = roomMap.get(stay.roomId);
      if (room) {
        room.stays.push(stay);
    
        // Convert strings to Date objects
        const dateFrom = new Date(stay.stayDateFrom);
        const dateTo = new Date(stay.stayDateTo);
    
        // Format dates in a short, readable format (e.g., "Aug 12, 2024")
        const formattedDateFrom = dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedDateTo = dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
        // Create a readable availability detail
        const availabilityDetail = `From: ${formattedDateFrom}, To: ${formattedDateTo}`;
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

    // Create a map to preserve availability details
    const availabilityMap = new Map<number, string[]>();

    // Populate the availability map from the merged data
    this.filteredRooms.forEach(room => {
      availabilityMap.set(room.roomId, room.availability);
    });

    // Start with all rooms
    this.filteredRooms = [...this.rooms];
    
    // Check if any filters are applied
    const hasLocationFilter = filters.location.trim() !== '';
    const hasDateFilter = filters.stayDateFrom || filters.stayDateTo;
    const hasGuestFilter = filters.numberOfPersons > 0;
    const hasPriceFilter = filters.maxPrice > 0;
    
    // Apply location filter
    if (hasLocationFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.locationName.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    // Apply date filter
    if (hasDateFilter) {
      const arrivalDate = filters.stayDateFrom ? new Date(filters.stayDateFrom) : null;
      const departureDate = filters.stayDateTo ? new Date(filters.stayDateTo) : null;
  
      if (arrivalDate && departureDate) {
        this.filteredRooms = this.filteredRooms.filter(room => {
          const stays = this.stays.filter(stay => stay.roomId === room.roomId);
          const isAvailable = stays.some(stay => {
            const stayFrom = new Date(stay.stayDateFrom);
            const stayTo = new Date(stay.stayDateTo);
            const isDateOverlap = stayFrom <= departureDate && stayTo >= arrivalDate;
  
            if (isDateOverlap) {
              const stayDuration = (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24) + 1; // Include both start and end day
              const isStayDurationMatch = stayDuration >= stay.minStay && stayDuration <= stay.maxStay;
              return isStayDurationMatch;
            }
  
            return false;
          });
  
          return isAvailable;
        });
      }
    }
    
    // Apply guest filter
    if (hasGuestFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.guestCapacity >= filters.numberOfPersons
      );
    }
    
    // Apply price filter
    if (hasPriceFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.pricePerDayPerPerson <= filters.maxPrice
      );
    }
    
    // Reapply the availability data to the filtered rooms
    this.filteredRooms = this.filteredRooms.map(room => ({
      ...room,
      availability: availabilityMap.get(room.roomId) || []
    }));

    // Log the result for debugging
    console.log('Filtered Rooms:', this.filteredRooms);
  }

  openBookingModal(room: Room): void {
    this.selectedRoom = room;

    // Populate booking form with details
    const stayDateFrom = this.filterForm.get('stayDateFrom')?.value;
    const stayDateTo = this.filterForm.get('stayDateTo')?.value;
    const numberOfPersons = this.filterForm.get('numberOfPersons')?.value;
    const pricePerDay = room.pricePerDayPerPerson;

    // Calculate number of days
    const startDate = new Date(stayDateFrom);
    const endDate = new Date(stayDateTo);
    const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

    // Calculate total price
    const totalPrice = numberOfDays * numberOfPersons * pricePerDay;

    this.bookingForm.patchValue({
      reservationId: this.generateReservationId(),
      roomNo: room.roomId,
      stayDateFrom,
      stayDateTo,
      numberOfDays,
      totalNumberOfGuests: numberOfPersons,
      pricePerDayPerPerson: pricePerDay,
      totalPrice
    });

    // Show the modal
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal')!);
    bookingModal.show();
  }

  closeBookingModal(): void {
    // Hide the modal
    const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal')!);
    bookingModal.hide();
  }

  confirmBooking(): void {
    if (this.bookingForm.valid) {
      // Implement booking confirmation logic, e.g., save to database, show confirmation message
      console.log('Booking Confirmed:', this.bookingForm.value);

      // Hide the modal
      this.closeBookingModal();

      // Clear form or reset state as needed
      this.bookingForm.reset();
      this.selectedRoom = null;
    } else {
      console.log('Form is invalid');
    }
  }
}
