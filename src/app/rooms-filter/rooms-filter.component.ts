import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../room.service';
import { StayService } from '../stays.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation, Customer} from '../Interfaces/reservation';
import { MatStepper } from '@angular/material/stepper';
import { ReservationStorageService } from '../services/reservation-storage.service';

@Component({
  selector: 'app-rooms-filter',
  templateUrl: './rooms-filter.component.html',
  styleUrls: ['./rooms-filter.component.scss']
})
export class RoomsFilterComponent implements OnInit {
  rooms: Room[] = [];
  stays: Stay[] = [];
  filteredRooms: Room[] = [];
  filterForm: FormGroup;
  bookingForm: FormGroup;
  customerForm: FormGroup;
  paymentForm: FormGroup;
  selectedRoom: Room | null = null;
  locations: string[] = [];
  availabilityDetails: string[] = [];
  numberOfGuestsOptions: number[] = [];
  isConfirmDisabled = true;
  currentStep = 0;
  

  @ViewChild('stepper') stepper!: MatStepper;
displayedColumns: any;

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private fb: FormBuilder,
    private reservationStorageService: ReservationStorageService,
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
      totalNumberOfGuests: [0, [Validators.required, Validators.min(1)]],
      pricePerDayPerPerson: [{ value: 0, disabled: true }],
      totalPrice: [{ value: 0, disabled: true }]
    });

    this.customerForm = this.fb.group({
      customerId: [{ value: '', disabled: true }],
      name: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(18)]],
      initialAddress: ['', Validators.required],
      mobileNumber: ['', Validators.required],
      pincode: [null, Validators.required],
      district: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentId: [{ value: '', disabled: true }],
      paymentMode: ['', Validators.required],
      paidAmount: [0, Validators.required],
      due: [0, Validators.required]
    });

    this.bookingForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
    this.bookingForm.get('totalNumberOfGuests')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm.get('numberOfDays')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm.get('pricePerDayPerPerson')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.customerForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
    this.paymentForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
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

  generateCustomerId(): string {
    const prefix = 'CID';
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNumber}`;
  }

  generatePaymentId(): string {
    const prefix = 'PID';
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
  
    const arrivalDate = filters.stayDateFrom ? new Date(filters.stayDateFrom) : null;
    const departureDate = filters.stayDateTo ? new Date(filters.stayDateTo) : null;
    const numberOfDays = arrivalDate && departureDate 
      ? Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24)) + 1 
      : 0;
  
    this.filteredRooms = [...this.rooms];
  
    const hasLocationFilter = filters.location.trim() !== '';
    const hasDateFilter = arrivalDate && departureDate;
    const hasGuestFilter = filters.numberOfPersons > 0;
    const hasPriceFilter = filters.maxPrice > 0;
  
    // Location filter
    if (hasLocationFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.locationName.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
  
    // Date filter with minStay and maxStay
    if (hasDateFilter) {
      this.filteredRooms = this.filteredRooms.filter(room => {
        const stays = this.stays.filter(stay => stay.roomId === room.roomId);
        
        return stays.some(stay => {
          const stayFrom = new Date(stay.stayDateFrom);
          const stayTo = new Date(stay.stayDateTo);
          const stayDuration = (stayTo.getTime() - stayFrom.getTime()) / (1000 * 3600 * 24) + 1;
  
          // Check if the stay covers the requested dates
          const isDateOverlap = stayFrom <= arrivalDate && stayTo >= departureDate;
  
          // Check if the stay duration is within the room's min and max stay requirements
          const isDurationValid = numberOfDays >= stay.minStay && numberOfDays <= stay.maxStay;
  
          return isDateOverlap && isDurationValid;
        });
      });
    }
  
    // Guest filter
    if (hasGuestFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.guestCapacity >= filters.numberOfPersons
      );
    }
  
    // Price filter
    if (hasPriceFilter) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.pricePerDayPerPerson <= filters.maxPrice
      );
    }
  
    // Update availability details for filtered rooms
    const availabilityMap = new Map<number, string[]>();
  
    this.filteredRooms.forEach(room => {
      const availabilityDetails = this.stays
        .filter(stay => stay.roomId === room.roomId)
        .map(stay => {
          const formattedDateFrom = new Date(stay.stayDateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const formattedDateTo = new Date(stay.stayDateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return `From: ${formattedDateFrom}, To: ${formattedDateTo}`;
        });
  
      availabilityMap.set(room.roomId, availabilityDetails);
    });
  
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

    this.customerForm.patchValue({
      customerId: this.generateCustomerId()
    });

    this.paymentForm.patchValue({
      paymentId: this.generatePaymentId()
    });

    this.updateTotalPrice();
    this.updateConfirmButtonState();

    // Initialize forms for stepper
    this.currentStep = 0;
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal')!);
    bookingModal.show();
  }

  closeBookingModal(): void {
    const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal')!);
    bookingModal.hide();
  }

  confirmBooking(): void {
    if (this.bookingForm.valid && this.customerForm.valid && this.paymentForm.valid && !this.isConfirmDisabled) {
      // Construct Reservation object
      const reservation: Reservation = {
        reservationId: String(this.bookingForm.get('reservationId')?.value),
        locationId: this.selectedRoom?.locationId || 0,
        roomId: Number(this.bookingForm.get('roomNo')?.value),
        customerId: String(this.customerForm.get('customerId')?.value),
        arrivalDate: this.bookingForm.get('stayDateFrom')?.value,
        departureDate: this.bookingForm.get('stayDateTo')?.value,
        reservationDate: new Date().toISOString(),
        totalPrice: Number(this.bookingForm.get('totalPrice')?.value),
        status: 'CONFIRM',
        paidAmount: Number(this.paymentForm.get('paidAmount')?.value),
        numberOfGuest: Number(this.bookingForm.get('totalNumberOfGuests')?.value),
      };
  
      // Parse customer name
      const nameParts = this.customerForm.get('name')?.value.split(' ') || [];
      let firstName = '';
      let middleName = '';
      let lastName = '';
  
      if (nameParts.length >= 2) {
        firstName = nameParts[0]; // First part is first name
        lastName = nameParts[nameParts.length - 1]; // Last part is last name
        if (nameParts.length === 3) {
          middleName = nameParts[1]; // Middle part is middle name
        }
      } else if (nameParts.length === 1) {
        firstName = nameParts[0]; // Only one name part, consider it as first name
      }
  
      // Construct Customer object
      const customer: Customer = {
        customerId: String(this.customerForm.get('customerId')?.value),
        age: Number(this.customerForm.get('age')?.value),
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        country: this.customerForm.get('country')?.value,
        state: this.customerForm.get('state')?.value,
        city: this.customerForm.get('city')?.value,
        pinCode: Number(this.customerForm.get('pincode')?.value),
        initialAddress: this.customerForm.get('initialAddress')?.value,
        mobileNumber1: Number(this.customerForm.get('mobileNumber')?.value),
        mobileNumber2: 0,
        birthDate: ''
      };
  
      // Combine both objects
      const reservationData = {
        reservation: reservation,
        customer: customer
      };
  
      // Save to local storage
      this.reservationStorageService.saveReservation(reservationData);
    
  
      // Reset and close modal
      this.closeBookingModal();
      this.bookingForm.reset();
      this.customerForm.reset();
      this.paymentForm.reset();
      this.selectedRoom = null;
    } else {
      console.log('Please fill out all required fields.');
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
    const filterFormValid = this.filterForm.get('stayDateFrom')?.value && this.filterForm.get('stayDateTo')?.value;
    const formValid = this.bookingForm.valid && this.customerForm.valid && this.paymentForm.valid;
    this.isConfirmDisabled = !(formValid && filterFormValid);
  }

  // Stepper Methods
  nextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
 
}
