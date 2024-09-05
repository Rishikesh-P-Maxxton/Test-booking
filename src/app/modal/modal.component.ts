import { Component, OnInit, ViewChild, ChangeDetectorRef, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../services/room.service';


import { Room } from '../Interfaces/room';

import { Reservation, Customer } from '../Interfaces/reservation';
import { MatStepper } from '@angular/material/stepper';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { GeolocsService } from '../services/geolocs.service';
import { BookingDetails } from '../Interfaces/booking-details';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})

export class ModalComponent implements OnInit {
  @Input() bookingDetails: BookingDetails | null = null; // Add this line
  // bookingDetails: BookingDetails | null;
  bookingForm: FormGroup;
  customerForm: FormGroup;
  paymentForm: FormGroup;
  currentStep: number = 1;
  guests: number[] = [];
  rooms: Room[] = [];
 
  
 
 
  selectedRoom: Room | null = null;
  locations: string[] = [];
  availabilityDetails: string[] = [];
  numberOfGuestsOptions: number[] = [];
  isConfirmDisabled = true;
  

 
  dateFilterApplied = false; 
 

  //Customer Form
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  selectedCountryId: string | null = null;
  selectedStateId: string | null = null;

  @ViewChild('stepper') stepper!: MatStepper;
  displayedColumns: any;

  constructor(
    private roomService: RoomService,
    private fb: FormBuilder,
    private reservationStorageService: ReservationStorageService,
    private cdr: ChangeDetectorRef, private geolocsService: GeolocsService

  ) {
  

    this.bookingForm = this.fb.group({
      reservationId: [{ value: '', disabled: true }],
      roomNo: [{ value: '', disabled: true }],
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
      paidAmount: [{ value: 0, disabled: true }, Validators.required],
      due: [0, Validators.required],
    });

    this.bookingForm.valueChanges.subscribe(() =>
      this.updateConfirmButtonState()
    );
    this.bookingForm
      .get('totalNumberOfGuests')
      ?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm
      .get('numberOfDays')
      ?.valueChanges.subscribe(() => this.updateTotalPrice());
    this.bookingForm
      .get('pricePerDayPerPerson')
      ?.valueChanges.subscribe(() => this.updateTotalPrice());
      this.paymentForm.get('due')?.valueChanges.subscribe(() => this.updateTotalPriceFromDue());
    this.customerForm.valueChanges.subscribe(() =>
      this.updateConfirmButtonState()
    );

    this.paymentForm.valueChanges.subscribe(() =>
      this.updateConfirmButtonState()
    );
  }

  
  ngOnInit(): void {
    console.log('hello');
    if (this.bookingDetails) {
      console.log('Booking data fetched');
      this.initializeForms(this.bookingDetails);
    }
  
    // Fetch countries for customer form
    this.geolocsService.getData().subscribe(response => {
      this.countries = response.countries;
    });
  
    // Initialize rooms and stays
    this.roomService.getRooms().subscribe((roomData) => {
      this.rooms = roomData;
    });

    this.bookingForm.valueChanges.subscribe(() => this.updateTotalPrice());
    this.paymentForm.get('due')?.valueChanges.subscribe(() => this.updateTotalPriceFromDue());
  
  }
  

  // Method to initialize forms with booking details
  // initializeForms(bookingDetails: BookingDetails): void {
  //   const room = this.rooms.find(r => r.roomId === bookingDetails.roomId) || null;

  //   console.log(bookingDetails, 'object from parent');
    
  //   if (room) {
  //     this.selectedRoom = room;
  //     this.availabilityDetails = room.availability;

  //     const stayDateFrom = bookingDetails.arrivalDate;
  //     const stayDateTo = bookingDetails.departureDate;
  //     const numberOfPersons = 0;
  //     const pricePerDay = room.pricePerDayPerPerson;

  //     const startDate = new Date(stayDateFrom);
  //     const endDate = new Date(stayDateTo);
  //     const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

  //     this.numberOfGuestsOptions = Array.from({ length: room.guestCapacity }, (_, i) => i + 1);

  //     this.bookingForm.patchValue({
  //       reservationId: this.generateReservationId(),
  //       roomNo: room.roomId,
  //       stayDateFrom,
  //       stayDateTo,
  //       numberOfDays,
  //       totalNumberOfGuests: numberOfPersons,
  //       pricePerDayPerPerson: pricePerDay,
  //     });

  //     this.customerForm.patchValue({
  //       customerId: this.generateCustomerId(),
  //     });

  //     this.paymentForm.patchValue({
  //       paymentId: this.generatePaymentId(),
  //     });

  //     this.updateTotalPrice();
  //     this.updateConfirmButtonState();
  //   }
  // }
  initializeForms(bookingDetails: BookingDetails): void {
    const room = this.rooms.find(r => r.roomId === bookingDetails.roomId) || null;

    console.log(bookingDetails, 'object from parent');
    
    if (room) {
        this.selectedRoom = room;
        this.availabilityDetails = room.availability;

        // Parse and normalize the dates
        const stayDateFrom = new Date(bookingDetails.arrivalDate );
        const stayDateTo = new Date(bookingDetails.departureDate);

        stayDateFrom.setDate(stayDateFrom.getDate() + 1);
        stayDateTo.setDate(stayDateTo.getDate() + 1);
        // Reset the time part of the dates to ensure the hours, minutes, seconds, and milliseconds are set to zero
        stayDateFrom.setHours(0, 0, 0, 0);
        stayDateTo.setHours(0, 0, 0, 0);

        // Ensure numberOfDays calculation works correctly
        const numberOfDays = Math.ceil((stayDateTo.getTime() - stayDateFrom.getTime()) / (1000 * 3600 * 24)) + 1;

        const numberOfPersons = 0;
        const pricePerDay = room.pricePerDayPerPerson;

        this.numberOfGuestsOptions = Array.from({ length: room.guestCapacity }, (_, i) => i + 1);

        this.bookingForm.patchValue({
            reservationId: this.generateReservationId(),
            roomNo: room.roomId,
            stayDateFrom: stayDateFrom.toISOString().split('T')[0] , // Format as YYYY-MM-DD
            stayDateTo: stayDateTo.toISOString().split('T')[0] , // Format as YYYY-MM-DD
            totalNumberOfGuests: numberOfPersons,
            pricePerDayPerPerson: pricePerDay,
            numberOfDays: numberOfDays
        });

        this.customerForm.patchValue({
            customerId: this.generateCustomerId(),
        });

        this.paymentForm.patchValue({
            paymentId: this.generatePaymentId(),
        });

        this.updateTotalPrice();
        this.updateConfirmButtonState();
    }
}

private updateTotalPriceFromDue(): void {
  const dueAmount = this.paymentForm.get('due')?.value || 0;
  const totalPrice = this.bookingForm.get('totalPrice')?.value || 0;

  if (totalPrice >= dueAmount) {
    const newPaidAmount = totalPrice - dueAmount;
    this.paymentForm.patchValue({ paidAmount: newPaidAmount }, { emitEvent: false });
  }
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
  
    if (this.bookingDetails) {
      const stayDateFrom = this.bookingDetails.arrivalDate;
      const stayDateTo = this.bookingDetails.departureDate;
      const numberOfPersons = this.bookingDetails.guestCapacity; // Corrected from undefined property
      const pricePerDay = room.pricePerDayPerPerson;
  
      const startDate = new Date(stayDateFrom);
      const endDate = new Date(stayDateTo);
      const numberOfDays =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
  
      this.numberOfGuestsOptions = Array.from({ length: room.guestCapacity }, (_, i) => i + 1);
  
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
  
      // Initialize forms for stepper
      this.currentStep = 0;
      const bookingModal = new bootstrap.Modal(document.getElementById('bookingsModal')!);
      bookingModal.show();
    }
  }
  

  closeBookingModal(): void {
    const bookingModal = bootstrap.Modal.getInstance(
      document.getElementById('bookingsModal')!
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
        email: ''
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

    // Update payment form based on the new total price
    this.updateTotalPriceFromDue();
  }
}


  private updateConfirmButtonState(): void {
    if(this.bookingDetails){
      
    const formValid =
      this.bookingForm.valid &&
      this.customerForm.valid &&
      this.paymentForm.valid;
    this.isConfirmDisabled = !(formValid);
    }
    
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
