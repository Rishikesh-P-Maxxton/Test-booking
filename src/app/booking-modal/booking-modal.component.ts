import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../room.service';
import { StayService } from '../stays.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation, Customer } from '../Interfaces/reservation';
import { MatStepper } from '@angular/material/stepper';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { GeolocsService } from '../services/geolocs.service';
import { ModalService } from '../services/modal-data.service';

@Component({
  selector: 'app-booking-modal',
  templateUrl: './booking-modal.component.html',
  styleUrls: ['./booking-modal.component.css']
})
export class BookingModalComponent implements OnInit {
  rooms: Room[] = [];
  stays: Stay[] = [];
  filteredRooms: Room[] = [];
  bookingForm: FormGroup;
  customerForm: FormGroup;
  paymentForm: FormGroup;
  selectedRoom: Room | null = null;
  locations: string[] = [];
  availabilityDetails: string[] = [];
  numberOfGuestsOptions: number[] = [];
  isConfirmDisabled = true;
  currentStep = 0;

  // Customer Form
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  selectedCountryId: string | null = null;
  selectedStateId: string | null = null;

  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('bookingModal') bookingModal!: ElementRef;

  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Input() roomId: number | null = null;

  @Input() reservationId: string | undefined;
 
  @Input() stayDateFrom: Date | undefined;
  @Input() stayDateTo: Date | undefined;
  @Input() showModal: boolean = false;
  @Output() close = new EventEmitter<void>();

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private fb: FormBuilder,
    private reservationStorageService: ReservationStorageService,
    private geolocsService: GeolocsService,
    private modalDataService: ModalService 
  ) {
    this.bookingForm = this.fb.group({
      reservationId: [{ value: '', disabled: true }],
      roomId: [{ value: '', disabled: true }],
      stayDateFrom: [{ value: '', disabled: true }],
      stayDateTo: [{ value: '', disabled: true }],
      numberOfDays: [{ value: 0, disabled: true }],
      totalNumberOfGuests: [0, [Validators.required, Validators.min(1)]],
      pricePerDayPerPerson: [{ value: 0, disabled: true }],
      totalPrice: [{ value: 0, disabled: true }],
    });

    this.customerForm = this.fb.group({
      customerId: [{ value: '', disabled: true }, Validators.required],
      name: ['', Validators.required],
      age: ['', Validators.required],
      initialAddress: ['', Validators.required],
      mobileNumber: ['', Validators.required],
      pincode: ['', Validators.required],
      country: ['', Validators.required],
      state: [{ value: '', disabled: true }, Validators.required],
      city: [{ value: '', disabled: true }, Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentId: [{ value: '', disabled: true }],
      paymentMode: ['', Validators.required],
      paidAmount: [0, Validators.required],
      due: [0, Validators.required],
    });

    this.bookingForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
    this.bookingForm.get('totalNumberOfGuests')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm.get('numberOfDays')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm.get('pricePerDayPerPerson')?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.customerForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
    this.paymentForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
  }

  ngOnInit(): void {
    this.geolocsService.getData().subscribe(response => {
      this.countries = response.countries;
    });

    this.roomService.getRooms().subscribe((roomData) => {
      this.rooms = roomData;
      this.stayService.getStays().subscribe((stayData) => {
        this.stays = stayData;
        this.mergeData();
        this.initializeLocations();
        if (this.startDate && this.endDate && this.roomId) {
          this.populateFormWithMergedData();
        }
      });
    });
  }

  onCountryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const countryId = target.value;
    this.selectedCountryId = countryId;
  
    // Find selected country
    const country = this.countries.find(c => c.countryId === countryId);
  
    // Update states and reset cities
    this.states = country ? country.states : [];
    this.cities = [];
    this.selectedStateId = null;
  
    // Update form controls
    this.customerForm.get('state')?.setValue('');
    this.customerForm.get('city')?.setValue('');
    
    // Enable or disable controls
    this.customerForm.get('state')?.enable();
    this.customerForm.get('city')?.disable();
  }

  onStateChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const stateId = target.value;
    this.selectedStateId = stateId;
  
    // Find selected country
    const country = this.countries.find(c => c.countryId === this.selectedCountryId);
    if (country) {
      // Find selected state
      const state = country.states.find((s: { stateId: string; }) => s.stateId === stateId);
      this.cities = state ? state.cities : [];
    }
  
    // Update form control and enable city dropdown if there are cities
    this.customerForm.get('city')?.setValue('');
    if (this.cities.length > 0) {
      this.customerForm.get('city')?.enable();
    } else {
      this.customerForm.get('city')?.disable();
    }
  }

  mergeData(): void {
    const roomMap = new Map<number, Room>();

    this.rooms.forEach((room) => {
      if (!roomMap.has(room.roomId)) {
        roomMap.set(room.roomId, { ...room, stays: [], availability: [] });
      }
    });

    this.stays.forEach((stay) => {
      const room = roomMap.get(stay.roomId);
      if (room) {
        room.stays.push(stay);

        const dateFrom = new Date(stay.stayDateFrom);
        const dateTo = new Date(stay.stayDateTo);

        const formattedDateFrom = dateFrom.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const formattedDateTo = dateTo.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

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
    const uniqueLocations = Array.from(
      new Set(this.rooms.map((room) => room.locationName))
    );
    this.locations = uniqueLocations;
  }

  populateFormWithMergedData(): void {
    const room = this.filteredRooms.find(r => r.roomId === this.roomId);

    if (room) {
      this.selectedRoom = room;
      this.availabilityDetails = room.availability;

      const stayDateFrom = this.startDate!;
      const stayDateTo = this.endDate!;
      const numberOfDays = Math.ceil(
        (stayDateTo.getTime() - stayDateFrom.getTime()) / (1000 * 3600 * 24)
      ) + 1;

      this.numberOfGuestsOptions = Array.from(
        { length: room.guestCapacity },
        (_, i) => i + 1
      );

      this.bookingForm.patchValue({
        reservationId: this.generateReservationId(),
        roomNo: room.roomId,
        stayDateFrom,
        stayDateTo,
        numberOfDays,
        totalNumberOfGuests: 0, // Set default or calculate based on requirement
        pricePerDayPerPerson: room.pricePerDayPerPerson,
      });

      this.customerForm.patchValue({
        customerId: this.generateCustomerId(),
      });

      this.paymentForm.patchValue({
        paymentId: this.generatePaymentId(),
        paidAmount: 0, // Default or based on calculation
        due: 0 // Default or based on calculation
      });

      this.updateTotalPrice();
      this.updateConfirmButtonState();

      // Initialize forms for stepper and show modal
      this.currentStep = 0;
      const modalElement = this.bookingModal.nativeElement as HTMLElement;
      const bookingModal = new bootstrap.Modal(modalElement);
      bookingModal.show();
    } else {
      console.error('No room found with the given ID.');
    }
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

  openBookingModal(room: Room): void {
    this.selectedRoom = room;
    this.availabilityDetails = room.availability;

    const stayDateFrom = this.startDate;
    const stayDateTo = this.endDate;
    const numberOfPersons = 0;
    const pricePerDay = room.pricePerDayPerPerson;

    // const startDate = new Date(stayDateFrom);
    // const endDate = new Date(stayDateTo);
    const numberOfDays =
      Math.ceil(
        (stayDateFrom!.getTime() - stayDateTo!.getTime()) / (1000 * 3600 * 24)
      ) + 1;

    this.numberOfGuestsOptions = Array.from(
      { length: room.guestCapacity },
      (_, i) => i + 1
    );

    this.bookingForm.patchValue({
      reservationId: this.generateReservationId(),
      roomNo: room.roomId,
      stayDateFrom,
      stayDateTo,
      numberOfDays,
      totalNumberOfGuests: numberOfPersons,
      pricePerDayPerPerson: pricePerDay,
    });

    this.customerForm.patchValue({
      customerId: this.generateCustomerId(),
    });

    this.paymentForm.patchValue({
      paymentId: this.generatePaymentId(),
    });

    this.updateTotalPrice();
    this.updateConfirmButtonState();

    this.populateFormWithMergedData();
    // Initialize forms for stepper and show modal
    this.currentStep = 0;
  const bookingModalElement = document.getElementById('bookingModal');
  
  if (bookingModalElement) {
    const bookingModal = new bootstrap.Modal(bookingModalElement, {
      backdrop: false  // Disable backdrop
    });
    bookingModal.show();
  }
  }

  closeBookingModal(): void {
    const bookingModal = bootstrap.Modal.getInstance(
      document.getElementById('bookingModal')!
    );
    bookingModal.hide();
  }

  confirmBooking(): void {
    if (
      this.bookingForm.valid &&
      this.customerForm.valid &&
      this.paymentForm.valid &&
      !this.isConfirmDisabled
    ) {
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
        numberOfGuest: Number(
          this.bookingForm.get('totalNumberOfGuests')?.value
        ),
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
        birthDate: '',
      };

      // Combine both objects
      const reservationData = {
        reservation: reservation,
        customer: customer,
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
    const numberOfGuests =
      this.bookingForm.get('totalNumberOfGuests')?.value || 0;
    const numberOfDays = this.bookingForm.get('numberOfDays')?.value || 0;
    const pricePerDayPerPerson =
      this.bookingForm.get('pricePerDayPerPerson')?.value || 0;

    if (numberOfGuests > 0 && numberOfDays > 0 && pricePerDayPerPerson > 0) {
      const totalPrice = numberOfGuests * numberOfDays * pricePerDayPerPerson;
      this.bookingForm.patchValue({ totalPrice }, { emitEvent: false });
      this.paymentForm.patchValue({ paidAmount: totalPrice }, { emitEvent: false });
    }
  }

  private updateConfirmButtonState(): void {
    const filterFormValid =
      this.bookingForm.get('stayDateFrom')?.value &&
      this.bookingForm.get('stayDateTo')?.value;
    const formValid =
      this.bookingForm.valid &&
      this.customerForm.valid &&
      this.paymentForm.valid;
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

  onClose() {
    this.close.emit();
  }
}
