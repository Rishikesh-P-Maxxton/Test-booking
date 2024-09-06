import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../services/room.service';
import { StayService } from '../services/stays.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation, Customer } from '../Interfaces/reservation';
import { MatStepper } from '@angular/material/stepper';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { GeolocsService } from '../services/geolocs.service';

export interface RoomAvailability {
  stayDateFrom: string;
  stayDateTo: string;
  arrivalDays: string[]; // e.g., ['Monday', 'Thursday']
  departureDays: string[]; // e.g., ['Wednesday', 'Saturday']
  minStay: number;
  maxStay: number;
}

@Component({
  selector: 'app-rooms-filter',
  templateUrl: './rooms-filter.component.html',
  styleUrls: ['./rooms-filter.component.css'],
 
})
export class RoomsFilterComponent implements OnInit {

  emailForm: FormGroup;
  existingCustomer!: Customer  | undefined ;

  isExistingUser = false;
  isNewUser = true;
  emailError: string | null = null;
  customerName: string | null = null;

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


  dateFilterApplied = false; 
  page: number = 1; // Current page number
  itemsPerPage: number = 10; // Number of items per page

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
    private stayService: StayService,
    private fb: FormBuilder,
    private reservationStorageService: ReservationStorageService,
    private cdr: ChangeDetectorRef, private geolocsService: GeolocsService

  ) {
    
    this.filterForm = this.fb.group({
      location: [''],
      stayDateFrom: [''],
      stayDateTo: [''],
      numberOfPersons: [0],
      maxPrice: [0],
    });

    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
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
      customerId: [{ value: '' }, Validators.required],
      name: ['', Validators.required],
      age: [
        '', 
        [
          Validators.required,
          Validators.min(0), // Ensure age is at least 0
          Validators.max(99) // Ensure age is less than 100
        ]
      ],
      initialAddress: ['', Validators.required],
      mobileNumber: ['', Validators.required],
      pincode: ['', Validators.required],
      country: ['', Validators.required],
      state: [{ value: '', disabled: true }, Validators.required],
      city: [{ value: '', disabled: true }, Validators.required],
      email: ['', Validators.required],
    });
    
    this.paymentForm = this.fb.group({
      paymentId: [{ value: '', disabled: true }],
      paymentMode: ['', Validators.required],
      paidAmount: [{ value: 0 }, Validators.required],
      due: [{ value: 0, disabled: true }, Validators.required],
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
    
    this.geolocsService.getData().subscribe(response => {
      this.countries = response.countries;
    });
    
    const totalPrice = this.bookingForm.get('totalPrice')?.value || 0;
  this.paymentForm.patchValue({ due: totalPrice });  // Set initial due to total price

  // Set up a listener for changes to the paidAmount
  this.paymentForm.get('paidAmount')?.valueChanges.subscribe(() => {
    this.calculateDueAmount();
  });

    this.roomService.getRooms().subscribe((roomData) => {
      this.rooms = roomData;
      this.stayService.getStays().subscribe((stayData) => {
        this.stays = stayData;
        this.mergeData();
        this.initializeLocations();
      });
    });
  }

  calculateDueAmount(): void {
    const totalPrice = this.bookingForm.get('totalPrice')?.value || 0;
    const paidAmount = this.paymentForm.get('paidAmount')?.value || 0;
  
    // Calculate the due amount as totalPrice - paidAmount
    const dueAmount = totalPrice - paidAmount;
  
    // Update the due field in the form
    this.paymentForm.patchValue({ due: dueAmount }, { emitEvent: false });
  }

  mergeData(): void {
    const roomMap = new Map<number, Room>();
  
    // Step 1: Create a map of rooms, initialize with empty availability
    this.rooms.forEach((room) => {
      if (!roomMap.has(room.roomId)) {
        roomMap.set(room.roomId, { ...room, availability: [] });  // availability as RoomAvailability[]
      }
    });
  
    // Step 2: Process stays and create RoomAvailability for each stay
    this.stays.forEach((stay) => {
      const room = roomMap.get(stay.roomId);
      if (room) {
        // Create RoomAvailability object for the stay
        const roomAvailability: RoomAvailability = {
          stayDateFrom: stay.stayDateFrom,
          stayDateTo: stay.stayDateTo,
          arrivalDays: stay.arrivalDays,    // List of allowed arrival days
          departureDays: stay.departureDays, // List of allowed departure days
          minStay: stay.minStay,  // Minimum stay duration in days
          maxStay: stay.maxStay,  // Maximum stay duration in days
        };
  
        // Add RoomAvailability to the room's availability array
        room.availability.push(roomAvailability);
      }
    });
  
    this.filteredRooms = Array.from(roomMap.values()); // Convert the map back to an array
    console.log('Merged Data with Room Availability:', this.filteredRooms);
  }
  
  

  
  private parseFullName(fullName: string): { firstName: string, middleName: string, lastName: string } {
    // List of honorary prefixes to ignore
    const honoraryPrefixes = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof.", "Miss"];
  
    // Remove any honorary prefix
    let nameParts = fullName.split(' ').filter(part => !honoraryPrefixes.includes(part));
  
    // Ensure we are left with non-empty name parts
    nameParts = nameParts.filter(part => part.trim() !== '');
  
    let firstName = '';
    let middleName = '';
    let lastName = '';
  
    if (nameParts.length === 2) {
      // If 2 names: first name + last name
      firstName = nameParts[0];
      lastName = nameParts[1];
    } else if (nameParts.length === 3) {
      // If 3 names: first name + middle name + last name
      firstName = nameParts[0];
      middleName = nameParts[1];
      lastName = nameParts[2];
    } else if (nameParts.length > 3) {
      // If more than 3 names: take the first and last as first and last name
      firstName = nameParts[0];
      lastName = nameParts[nameParts.length - 1];
    } else if (nameParts.length === 1) {
      // If only one name is provided, consider it as first name
      firstName = nameParts[0];
    }
  
    return { firstName, middleName, lastName };
  }
  



  initializeLocations(): void {
    const uniqueLocations = Array.from(
      new Set(this.rooms.map((room) => room.locationName))
    );
    this.locations = uniqueLocations;
  }

  onUserSelectionChange(isNewUser: boolean): void {
    if (isNewUser) {
      this.customerForm.get('customerId')?.enable(); // Enable customerId field for new user
      this.customerForm.get('customerId')?.setValue(this.generateCustomerId()); // Set new customerId
    } else {
      this.customerForm.get('customerId')?.disable(); // Disable customerId field for existing user
    }
  }
  
  // Method to patch the form with existing customer data
  patchFormWithExistingCustomer(customer: Customer): void {
    this.customerForm.patchValue({
      customerId: customer.customerId, // Existing customerId
      name: `${customer.firstName} ${customer.middleName} ${customer.lastName}`,
      age: customer.age,
      country: customer.country,
      state: customer.state,
      city: customer.city,
      pincode: customer.pinCode,
      initialAddress: customer.initialAddress,
      mobileNumber: customer.mobileNumber1,
      email: customer.email
    });
  }
  



  fetchExistingCustomer(): void {
    const email = this.emailForm.get('email')?.value;
  
    if (email) {
      this.reservationStorageService.getCustomerByEmail(email).subscribe({
        next: (customer: Customer | undefined) => {
          if (customer) {
            this.existingCustomer = customer;
            this.customerName = `${customer.firstName} ${customer.lastName}`;
            this.emailError = null;
            
            // Directly set the fetched customer in the booking object
            this.isConfirmDisabled = false; // Enable the stepper when customer is fetched
          } else {
            this.emailError = 'Customer not found.';
            this.existingCustomer = undefined;
            this.customerName = null;
            this.isConfirmDisabled = true; // Disable the stepper if customer not found
          }
        },
        error: (err) => {
          console.error('Error fetching customer by email', err);
          this.emailError = 'An error occurred while fetching customer details.';
          this.existingCustomer = undefined;
          this.customerName = null;
          this.isConfirmDisabled = true;
        }
      });
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
  
  private updateTotalPriceFromDue(): void {
    const dueAmount = this.paymentForm.get('due')?.value || 0;
    const totalPrice = this.bookingForm.get('totalPrice')?.value || 0;
  
    // Ensure totalPrice is valid and greater than or equal to dueAmount
    if (totalPrice >= dueAmount) {
      const newPaidAmount = totalPrice - dueAmount;
      this.paymentForm.patchValue({ paidAmount: newPaidAmount }, { emitEvent: false });
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

  applyFilter(): void {
    const filters = this.filterForm.value;
    
    // Parse date inputs (optional fields)
    const stayDateFrom = filters.stayDateFrom ? new Date(filters.stayDateFrom + 'T11:00:00') : null;
    const stayDateTo = filters.stayDateTo ? new Date(filters.stayDateTo + 'T10:00:00') : null;
  
    // Check if both date fields are filled and valid
    const hasValidDateFilter = stayDateFrom && stayDateTo && stayDateFrom <= stayDateTo;
  
    // If only one date is filled or the range is invalid, reset the flag
    if (stayDateFrom && stayDateTo && stayDateFrom <= stayDateTo) {
      this.dateFilterApplied = true;
    } else {
      this.dateFilterApplied = false;
    }
  
    // Start with all rooms (reset the filtered list)
    this.filteredRooms = [...this.rooms];
  
    // Apply the location filter if it's filled
    if (filters.location.trim()) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.locationName.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
  
    // Apply the guest filter (if the user specified a number of guests)
    if (filters.numberOfPersons > 0) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.guestCapacity >= filters.numberOfPersons
      );
    }
  
    // Apply the price filter (if the user specified a maximum price)
    if (filters.maxPrice > 0) {
      this.filteredRooms = this.filteredRooms.filter(room =>
        room.pricePerDayPerPerson <= filters.maxPrice
      );
    }
  
    // If valid date filters are applied, apply date-based room availability filter
    if (hasValidDateFilter) {
      this.filteredRooms = this.filteredRooms.filter(room => {
        return room.availability.some(availability => {
          const stayFrom = new Date(availability.stayDateFrom + 'T11:00:00');
          const stayTo = new Date(availability.stayDateTo + 'T10:00:00');
  
          // Check if the date range is completely within the availability period
          const isWithinStayRange = this.isDateRangeCompletelyWithin(
            stayDateFrom!,
            stayDateTo!,
            stayFrom,
            stayTo
          );
  
          // Calculate the number of days the user is staying
          const numberOfDays = this.calculateNumberOfDays(stayDateFrom!, stayDateTo!);
  
          // Check if the selected dates match the allowed arrival and departure days
          const matchesArrivalDay = this.isArrivalDay(availability, filters.stayDateFrom);
          const matchesDepartureDay = this.isDepartureDay(availability, filters.stayDateTo);
  
          // Validate the stay duration against the minStay and maxStay constraints
          const isDurationValid = numberOfDays >= availability.minStay && numberOfDays <= availability.maxStay;
  
          // Return true if all conditions are satisfied (dates within range, correct arrival/departure days, valid duration)
          return isWithinStayRange && matchesArrivalDay && matchesDepartureDay && isDurationValid;
        });
      });
    }
  
    // Log the filtered rooms for debugging purposes
    console.log('Filtered Rooms:', this.filteredRooms);
  }
  
  
  private isArrivalDay(availability: RoomAvailability, date: string): boolean {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    return availability.arrivalDays.includes(dayOfWeek);
  }
  
  private isDepartureDay(availability: RoomAvailability, date: string): boolean {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    return availability.departureDays.includes(dayOfWeek);
  }
  
  isDateRangeCompletelyWithin(
    filterStart: Date,
    filterEnd: Date,
    bookingStart: Date,
    bookingEnd: Date
  ): boolean {
    return filterStart >= bookingStart && filterEnd <= bookingEnd;
  }
  

  get isFilterButtonDisabled(): boolean {
    const filters = this.filterForm.value;
    const stayDateFrom = filters.stayDateFrom;
    const stayDateTo = filters.stayDateTo;
    
    // Case 1: If one of the date fields is filled, the other must also be filled
    const isPartialDateFilled = (stayDateFrom && !stayDateTo) || (!stayDateFrom && stayDateTo);
    
    // Case 2: If dates are invalid (e.g., 'From' date is after 'To' date)
    const isInvalidDateRange = stayDateFrom && stayDateTo && new Date(stayDateFrom) > new Date(stayDateTo);
    
    // Disable the button if one date field is filled without the other or if the date range is invalid
    return isPartialDateFilled || isInvalidDateRange;
  }
  
  
  isDateFilterApplied(): boolean {
    const stayDateFrom = this.filterForm.get('stayDateFrom')?.value;
    const stayDateTo = this.filterForm.get('stayDateTo')?.value;
  
    // Return true only if both date fields are filled and valid
    return !!stayDateFrom && !!stayDateTo && new Date(stayDateFrom) <= new Date(stayDateTo);
  }
  

calculateNumberOfDays(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);

  // Ensure at least one day is counted if the dates are the same
  return startDate.toDateString() === endDate.toDateString() ? 1 : numberOfDays;
}

  

  



private isDateRangeOverlapping(
  newArrival: Date,
  newDeparture: Date,
  existingArrival: Date,
  existingDeparture: Date
): boolean {
  // Check if the new arrival is before the existing departure
  // and the new departure is after the existing arrival
  return newArrival < existingDeparture && newDeparture > existingArrival;
}

// Helper function to check if a new booking can fit in the available period
private isBookingAvailable(
  newArrivalDate: Date,
  newDepartureDate: Date,
  existingReservations: { arrivalDate: Date; departureDate: Date }[]
): boolean {
  return !existingReservations.some((reservation) =>
    this.isDateRangeOverlapping(
      newArrivalDate,
      newDepartureDate,
      reservation.arrivalDate,
      reservation.departureDate
    )
  );
}


  clearFilter(): void {
    this.filterForm.reset();
    this.filteredRooms = [...this.rooms];
    this.dateFilterApplied = false; // Reset the flag when clearing the filter
    
  } 
  



  openBookingModal(room: Room): void {
    this.selectedRoom = room;
  
    // Check if room.availability is defined and is an array before mapping over it
    if (room.availability && Array.isArray(room.availability)) {
      // Convert RoomAvailability objects to a readable string format
      this.availabilityDetails = room.availability.map(availability => {
        return `Available from ${availability.stayDateFrom} to ${availability.stayDateTo}, 
                Arrival Days: ${availability.arrivalDays.join(', ')}, 
                Departure Days: ${availability.departureDays.join(', ')}, 
                Min Stay: ${availability.minStay} days, Max Stay: ${availability.maxStay} days`;
      });
    } else {
      this.availabilityDetails = []; // Fallback if no availability is found
    }
  
    let stayDateFrom = this.filterForm.get('stayDateFrom')?.value;
    let stayDateTo = this.filterForm.get('stayDateTo')?.value;
    const numberOfPersons = this.filterForm.get('numberOfPersons')?.value;
    const pricePerDay = room.pricePerDayPerPerson;
  
    // Adjust start and end dates based on the new logic
    let startDate = new Date(stayDateFrom + 'T11:00:00');
    let endDate = new Date(stayDateTo + 'T10:00:00');
  
    // If stayDateFrom and stayDateTo are the same, increment endDate by 1 day
    if (startDate.toDateString() === endDate.toDateString()) {
      endDate.setDate(endDate.getDate() + 1);
    }
  
    // Calculate number of days considering the new logic
    const numberOfDays = this.calculateNumberOfDays(startDate, endDate);
  
    // Populate the number of guests options
    this.numberOfGuestsOptions = Array.from({ length: room.guestCapacity }, (_, i) => i + 1);
  
    // Patch the booking form values
    this.bookingForm.patchValue({
      reservationId: this.generateReservationId(),
      roomNo: room.roomId,
      stayDateFrom: startDate.toISOString().split('T')[0],
      stayDateTo: endDate.toISOString().split('T')[0],
      numberOfDays,
      totalNumberOfGuests: numberOfPersons,
      pricePerDayPerPerson: pricePerDay,
    });
  
    // Patch customer and payment forms
    this.customerForm.patchValue({ customerId: this.generateCustomerId() });
    this.paymentForm.patchValue({ paymentId: this.generatePaymentId() });
  
    // Update the total price
    this.updateTotalPrice();
    this.updateConfirmButtonState();
  
    // Open the modal using Bootstrap's JavaScript API
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal')!, {
      keyboard: false
    });
    bookingModal.show();
  }
  
  
  
  
  

  closeBookingModal(): void {
    const bookingModal = bootstrap.Modal.getInstance(
      document.getElementById('bookingModal')!
    );
    bookingModal.hide();
  }

  confirmBooking(): void {
    if (this.bookingForm.valid && this.paymentForm.valid && !this.isConfirmDisabled) {
      let customerId: string;
    
      // For new customers, generate a new ID
      if (this.isNewUser) {
        customerId = this.generateCustomerId();
      } else {
        // For existing customers, use the fetched customer ID
        if (this.existingCustomer) {
          customerId = this.existingCustomer.customerId;
        } else {
          console.error('Fetched customer is not available');
          return;
        }
      }
  
      // Construct the reservation object
      const reservation: Reservation = {
        reservationId: String(this.bookingForm.get('reservationId')?.value),
        locationId: this.selectedRoom?.locationId || 0,
        roomId: Number(this.bookingForm.get('roomNo')?.value),
        customerId: customerId, // Use the generated or fetched customer ID
        arrivalDate: this.bookingForm.get('stayDateFrom')?.value,
        departureDate: this.bookingForm.get('stayDateTo')?.value,
        reservationDate: new Date().toISOString(),
        totalPrice: Number(this.bookingForm.get('totalPrice')?.value),
        status: 'CONFIRM',
        paidAmount: Number(this.paymentForm.get('paidAmount')?.value),
        numberOfGuest: Number(this.bookingForm.get('totalNumberOfGuests')?.value),
      };
  
      let customer: Customer;
      
      // If it's a new user, construct the customer object from the form
      if (this.isNewUser) {
        const fullName = this.customerForm.get('name')?.value || '';
    const { firstName, middleName, lastName } = this.parseFullName(fullName);
  
        customer = {
          customerId: customerId,
          firstName,
          middleName,
          lastName,
          age: Number(this.customerForm.get('age')?.value),
          country: this.customerForm.get('country')?.value,
          state: this.customerForm.get('state')?.value,
          city: this.customerForm.get('city')?.value,
          pinCode: Number(this.customerForm.get('pincode')?.value),
          initialAddress: this.customerForm.get('initialAddress')?.value,
          mobileNumber1: Number(this.customerForm.get('mobileNumber')?.value),
          mobileNumber2: 0, // Default mobile number
          birthDate: '',
          email: this.customerForm.get('email')?.value,
        };
      } else {
        // For existing users, use the fetched customer object
        customer = this.existingCustomer as Customer;
      }
  
      const reservationData = { reservation, customer };
  
      // Save the reservation
      this.reservationStorageService.saveReservation(reservationData);
  
      // Reset the forms and close the modal
      this.closeBookingModal();
      this.bookingForm.reset();
      this.customerForm.reset();
      this.paymentForm.reset();
      this.selectedRoom = null;
      this.isConfirmDisabled = true; // Disable the confirm button until valid forms are filled
    } else {
      console.log('Please fill out all required fields.');
    }
  }
  
  
  
  
  
  private updateTotalPrice(): void {
    const numberOfGuests =
      this.bookingForm.get('totalNumberOfGuests')?.value || 0;
    const numberOfDays =
      this.bookingForm.get('numberOfDays')?.value || 0;
    const pricePerDay = this.bookingForm.get('pricePerDayPerPerson')?.value || 0;
  
    const totalPrice = numberOfGuests * numberOfDays * pricePerDay;
    this.bookingForm.patchValue({ totalPrice });
  }
  
  

  private updateConfirmButtonState(): void {
    const filterFormValid = this.filterForm.get('stayDateFrom')?.value && this.filterForm.get('stayDateTo')?.value;
    
    // For new users, validate the customer form
    const isCustomerFormValid = this.isNewUser ? this.customerForm.valid : true;
    
    // For existing users, ensure a customer is fetched
    const isExistingCustomerValid = !this.isNewUser ? !!this.existingCustomer : true;
  
    // Payment and booking forms must always be valid
    const isBookingFormValid = this.bookingForm.valid;
    const isPaymentFormValid = this.paymentForm.valid;
    
    // Enable confirmation only if all required forms are valid
    this.isConfirmDisabled = !(filterFormValid && (isCustomerFormValid || isExistingCustomerValid) && isBookingFormValid && isPaymentFormValid);
  }
  


  selectNewUser(): void {
    this.isNewUser = true;
    this.isExistingUser = false;
    this.emailError = null;
    this.customerForm.reset();
    this.emailForm.reset();
  
    // Generate a new customer ID and set it in the customer form
    const newCustomerId = this.generateCustomerId();
    this.customerForm.patchValue({ customerId: newCustomerId });
  }
  

  selectExistingUser(): void {
    this.isNewUser = false;
    this.isExistingUser = true;
    this.emailError = null;
    this.customerForm.reset();
    this.emailForm.reset();
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
