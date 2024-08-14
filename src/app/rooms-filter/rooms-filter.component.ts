import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  availabilityDetails: string[] = [];
  numberOfGuestsOptions: number[] = [];
  isConfirmDisabled = true;

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
      reservationId: [{ value: '', disabled: true }],
      roomNo: [{ value: '', disabled: true }],
      stayDateFrom: [{ value: '', disabled: true }],
      stayDateTo: [{ value: '', disabled: true }],
      numberOfDays: [{ value: 0, disabled: true }],
      totalNumberOfGuests: [0, Validators.required],
      pricePerDayPerPerson: [{ value: 0, disabled: true }],
      totalPrice: [{ value: 0, disabled: true }]
    });

    // Update total price whenever relevant fields change
    this.bookingForm.get('totalNumberOfGuests')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm.get('numberOfDays')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm.get('pricePerDayPerPerson')?.valueChanges.subscribe(() => this.updateTotalPrice());

    // Update the confirm button state based on form validity
    this.bookingForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
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
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNumber}`;
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

        const dateFrom = new Date(stay.stayDateFrom);
        const dateTo = new Date(stay.stayDateTo);

        const formattedDateFrom = dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedDateTo = dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const availabilityDetail = `From: ${formattedDateFrom}, To: ${formattedDateTo}`;
        if (!room.availability.includes(availabilityDetail)) {
          room.availability.push(availabilityDetail);
        }
      }
    });

    this.filteredRooms = Array.from(roomMap.values());
    console.log('Merged Data:', this.filteredRooms);
  }

  initializeLocations(): void {
    const uniqueLocations = Array.from(new Set(this.rooms.map(room => room.locationName)));
    this.locations = uniqueLocations;
  }

  applyFilter(): void {
    const filters = this.filterForm.value;
    console.log('Filter Values:', filters);

    const availabilityMap = new Map<number, string[]>();

    this.filteredRooms.forEach(room => {
      availabilityMap.set(room.roomId, room.availability);
    });

    this.filteredRooms = [...this.rooms];
    
    const hasLocationFilter = filters.location.trim() !== '';
    const hasDateFilter = filters.stayDateFrom || filters.stayDateTo;
    const hasGuestFilter = filters.numberOfPersons > 0;
    const hasPriceFilter = filters.maxPrice > 0;
    
    if (hasLocationFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.locationName.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
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
              const stayDuration = (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24) + 1;
              const isStayDurationMatch = stayDuration >= stay.minStay && stayDuration <= stay.maxStay;
              return isStayDurationMatch;
            }
  
            return false;
          });
  
          return isAvailable;
        });
      }
    }
    
    if (hasGuestFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.guestCapacity >= filters.numberOfPersons
      );
    }
    
    if (hasPriceFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.pricePerDayPerPerson <= filters.maxPrice
      );
    }
    
    this.filteredRooms = this.filteredRooms.map(room => ({
      ...room,
      availability: availabilityMap.get(room.roomId) || []
    }));

    console.log('Filtered Rooms:', this.filteredRooms);
  }

  openBookingModal(room: Room): void {
    this.selectedRoom = room;
    this.availabilityDetails = room.availability;

    const stayDateFrom = this.filterForm.get('stayDateFrom')?.value;
    const stayDateTo = this.filterForm.get('stayDateTo')?.value;
    const numberOfPersons = this.filterForm.get('numberOfPersons')?.value;
    const pricePerDay = room.pricePerDayPerPerson;

    const startDate = new Date(stayDateFrom);
    const endDate = new Date(stayDateTo);
    const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

    this.numberOfGuestsOptions = Array.from({ length: room.guestCapacity }, (_, i) => i + 1);

    this.bookingForm.patchValue({
      reservationId: this.generateReservationId(),
      roomNo: room.roomId,
      stayDateFrom,
      stayDateTo,
      numberOfDays,
      totalNumberOfGuests: numberOfPersons,
      pricePerDayPerPerson: pricePerDay
    });

    // Manually update the confirm button state
    this.updateConfirmButtonState();

    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal')!);
    bookingModal.show();
  }

  closeBookingModal(): void {
    const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal')!);
    bookingModal.hide();
  }

  confirmBooking(): void {
    if (this.bookingForm.valid && !this.isConfirmDisabled) {
      console.log('Booking Confirmed:', this.bookingForm.value);

      this.closeBookingModal();
      this.bookingForm.reset();
      this.selectedRoom = null;
    } else {
      console.log('Form is invalid or button is disabled');
    }
  }

  private updateTotalPrice(): void {
    const numberOfGuests = this.bookingForm.get('totalNumberOfGuests')?.value || 0;
    const numberOfDays = this.bookingForm.get('numberOfDays')?.value || 0;
    const pricePerDayPerPerson = this.bookingForm.get('pricePerDayPerPerson')?.value || 0;

    if (numberOfGuests > 0 && numberOfDays > 0 && pricePerDayPerPerson > 0) {
      const totalPrice = numberOfGuests * numberOfDays * pricePerDayPerPerson;
      this.bookingForm.patchValue({ totalPrice }, { emitEvent: false });
    }
  }

  private updateConfirmButtonState(): void {
    this.isConfirmDisabled = !this.bookingForm.valid;
  }
}
