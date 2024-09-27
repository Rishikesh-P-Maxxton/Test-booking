import { Component, OnInit, ViewChild, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../services/room.service';
import { StayService } from '../services/stays.service';
import { Room } from '../Interfaces/room';
import { Stay } from '../Interfaces/stay';
import { Reservation, Customer } from '../Interfaces/reservation';
import { MatStepper } from '@angular/material/stepper';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { GeolocsService } from '../services/geolocs.service';
import { MatDialog } from '@angular/material/dialog';

import jspdf, { jsPDF } from 'jspdf';
import { Router, RouterLink } from '@angular/router';
interface FilteredRoom {
  roomId: number;
  locationId: number;
  locationName: string;
  roomName: string;
  pricePerDayPerPerson: number;
  guestCapacity: number;
  stays: Stay[]; 
  selectedStay?: Stay; // Array of stay periods, each with its own availability and restrictions
}
@Component({
  selector: 'app-new-rooms-filter',
  templateUrl: './new-rooms-filter.component.html',
  styleUrl: './new-rooms-filter.component.css'
})
export class NewRoomsFilterComponent implements OnInit {

  emailForm: FormGroup;
  totalPrice: FormGroup;
  existingCustomer!: Customer  | undefined ;

  isExistingUser = false;
  isNewUser = true;
  emailError: string | null = null;
  customerName: string | null = null;

  rooms: Room[] = [];
  stays: Stay[] = [];
  filteredRooms: FilteredRoom[] = [];
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
  @ViewChild('reservationDialog') reservationDialog!: TemplateRef<any>;
  displayedColumns: any;
  emittedObject: any = null;  // This will hold the emitted data from the dual calendar component


  allEmails: string[] = [];  // List of all unique emails
  filteredEmails: string[] = [];  // Filtered emails for dropdown
  emailDropdownVisible: boolean = false;  // Control the dropdown visibility

  constructor(
    private roomService: RoomService,
    private stayService: StayService,
    private fb: FormBuilder,
    private reservationStorageService: ReservationStorageService,
    private cdr: ChangeDetectorRef, private geolocsService: GeolocsService,
    public dialog: MatDialog,
    private router: Router,
    

  ) {
    this.filterForm = this.fb.group({
      arrivalDate: [{ value: '', disabled: true }],  // Will be populated with emitted date
      departureDate: [{ value: '', disabled: true }], // Will be populated with emitted date
      numberOfGuests: [{ value: '', disabled: true }] // Guest capacity dropdown, initially disabled
    });
    

    this.totalPrice = this.fb.group({
      tp: [{ value: '', disabled: true }]
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
      totalPrice: [{ value: 0, disabled: true }]  // Add totalPrice here
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

    this.reservationStorageService.getAllCustomerEmails().subscribe((emails: string[]) => {
      this.allEmails = emails;
      this.filteredEmails = [...this.allEmails];  // Initially show all emails
    });
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
    this.filteredRooms = this.rooms.map((room) => {
      const matchingStays = this.stays.filter((stay) => stay.roomId === room.roomId);
  
      return {
        roomId: room.roomId,
        locationId: room.locationId,
        locationName: room.locationName,
        roomName: room.roomName,
        pricePerDayPerPerson: room.pricePerDayPerPerson,
        guestCapacity: room.guestCapacity,
        stays: matchingStays  //assigning matching stays using the existing Stay interface
      } as FilteredRoom;
    });
    console.log("Merged Data",this.filteredRooms )
  }
  

  
  private parseFullName(fullName: string): { firstName: string, middleName: string, lastName: string } {
    // List of prefixes to ignore
    const honoraryPrefixes = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof.", "Miss"];
  
    // Remove any prefix
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
  


  onEmailBlur(): void {
    const email = this.emailForm.get('email')?.value;
    if (email) {
      this.reservationStorageService.getCustomerByEmail(email).subscribe({
        next: (customer: Customer | undefined) => {
          if (customer) {
            this.existingCustomer = customer;
            this.customerName = `${customer.firstName} ${customer.lastName}`;
            this.emailError = null; // Clear any previous errors
          } else {
            this.emailError = 'Customer not found.';
            this.existingCustomer = undefined;
            this.customerName = null;
          }
        },
        error: (err) => {
          console.error('Error fetching customer by email', err);
          this.emailError = 'An error occurred while fetching customer details.';
          this.existingCustomer = undefined;
          this.customerName = null;
        }
      });
    }
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
    const selectedGuests = this.filterForm.get('numberOfGuests')?.value;
  
    if (selectedGuests) {
      // Filter rooms by guest capacity if a guest number is selected
      this.filteredRooms = this.emittedObject.filteredRooms.filter((room: { guestCapacity: number; }) => room.guestCapacity >= selectedGuests); 
      this.goToRoomList();
    } else {
      // If no guest filter applied, use all rooms from the emitted object
      this.filteredRooms = this.emittedObject.filteredRooms;
    }
  
    console.log('Filtered Rooms:', this.filteredRooms);
  console.log('rytt')
  
    // Continue with any additional booking logic that was in your original applyFilter
  }
  
  
  
  


  get isFilterButtonDisabled(): boolean {
    const arrivalDate = this.filterForm.get('arrivalDate')?.value;
    const departureDate = this.filterForm.get('departureDate')?.value;
  
    // Enable the button only if both dates are selected
    return !(arrivalDate && departureDate);
  }
  
 isDateFilterApplied(): boolean {
  const stayDateFrom = this.filterForm.get('stayDateFrom')?.value;
  const stayDateTo = this.filterForm.get('stayDateTo')?.value;

  // Check if both stayDateFrom and stayDateTo are not empty, are valid dates, and the dateFilterApplied flag is true
  return stayDateFrom && stayDateTo && new Date(stayDateFrom).getTime() <= new Date(stayDateTo).getTime() && this.dateFilterApplied;
}

calculateNumberOfDays(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);

  // Ensure at least one day is counted if the dates are the same
  return startDate.toDateString() === endDate.toDateString() ? 1 : numberOfDays;
}

  

  // Helper function to check if the requested date range is completely within the room's date range
  isDateRangeCompletelyWithin(
    filterStart: Date,
    filterEnd: Date,
    bookingStart: Date,
    bookingEnd: Date
  ): boolean {
    return filterStart >= bookingStart && filterEnd <= bookingEnd;
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
  



  openBookingModal(room: FilteredRoom): void {
    this.selectedRoom = room;
    console.log(room);
  
    // Ensure room.selectedStay exists
    if (!room.selectedStay) {
      console.error("No matching stay found for this room.");
      return;  // Exit if no selectedStay is available for this room
    }
  
    // Extract stay dates from the filter form
    const stayDateFrom = this.filterForm.get('stayDateFrom')?.value;
    const stayDateTo = this.filterForm.get('stayDateTo')?.value;
  
    if (!stayDateFrom || !stayDateTo) {
      console.error("Stay dates not provided.");
      return;
    }
  
    // Convert the dates into proper Date objects
    const startDate = new Date(stayDateFrom + 'T11:00:00');
    const endDate = new Date(stayDateTo + 'T10:00:00');
  
    // Ensure at least one day is counted (if start and end dates are the same)
    if (startDate.toDateString() === endDate.toDateString()) {
      endDate.setDate(endDate.getDate() + 1);
    }
  
    // Get the number of days between the selected dates
    const numberOfDays = this.calculateNumberOfDays(startDate, endDate);
  
    // Populate booking form with the selectedStay and room details
    const numberOfPersons = this.filterForm.get('numberOfPersons')?.value;
    const pricePerDay = room.pricePerDayPerPerson;
  
    this.numberOfGuestsOptions = Array.from(
      { length: room.guestCapacity },
      (_, i) => i + 1
    ); 

    // Update form fields with the selected room and stay details
    this.bookingForm.patchValue({
      reservationId: this.generateReservationId(),
      roomNo: room.roomId,
      stayDateFrom: startDate.toISOString().split('T')[0],
      stayDateTo: endDate.toISOString().split('T')[0],
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
  
    // Show the booking modal
    const bookingModal = new bootstrap.Modal(
      document.getElementById('bookingModal')!
    );
    
  }
  
  
  
  
  
  

 

  confirmBooking(): void {
    if (this.bookingForm.valid && this.paymentForm.valid && !this.isConfirmDisabled) {
      // Get the reservation and customer objects
      const { reservation, customer } = this.createReservationObject();
  
      const reservationData = { reservation, customer };
  
      // Save the reservation
      this.reservationStorageService.saveReservation(reservationData);
  
      // Reset the forms and close the modal
      this.closeBookingModal();
      this.bookingForm.reset();
      this.customerForm.reset();
      this.paymentForm.reset();
      this.selectedRoom = null;
      this.isConfirmDisabled = true; // Disable the confirm button
      
    } else {
      console.log('Please fill out all required fields.');
    }
  }

  // Function to show a toast with Confirm and Cancel buttons
  showToastWithNavigationOption(): void {
    const toastElement = document.getElementById('navigationToast'); // Your toast element
    if (toastElement) {
      const toast = new bootstrap.Toast(toastElement); // Initialize the toast
      toast.show(); // Show the toast

      // Attach event listeners for buttons inside the toast
      const confirmButton = document.getElementById('confirmNavigate');
      const cancelButton = document.getElementById('cancelNavigate');

      confirmButton?.addEventListener('click', () => {
        this.navigateToPlanner(); // Navigate on Confirm
        toast.hide();
        toast.dispose()  // Close the toast after navigation
      });

      cancelButton?.addEventListener('click', () => {
        toast.hide();
        toast.dispose() // Just close the toast on Cancel
      });
    }
  }

  // Function to navigate to a given route (in this case, 'planner')
  navigateToPlanner(): void {
    this.router.navigate(['/planner']); // Replace '/planner' with the desired route
  }


  
  private updateTotalPrice(): void {
    const numberOfGuests =
      this.bookingForm.get('totalNumberOfGuests')?.value || 0;
    const numberOfDays =
      this.bookingForm.get('numberOfDays')?.value || 0;
    const pricePerDay = this.bookingForm.get('pricePerDayPerPerson')?.value || 0;
  
    const totalPrice =numberOfDays * pricePerDay;
    this.bookingForm.patchValue({ totalPrice });
    this.paymentForm.patchValue({ totalPrice });
  }
  
  

  private updateConfirmButtonState(): void {
    const filterFormValid = this.filterForm.valid;
    
    const isCustomerFormValid = this.isNewUser ? this.customerForm.valid : true;
    const isExistingCustomerValid = !this.isNewUser ? !!this.existingCustomer : true;
    const isBookingFormValid = this.bookingForm.valid;
    const isPaymentFormValid = this.paymentForm.valid;
  
    console.log('Confirm Button State: ', {
      filterFormValid,
      isCustomerFormValid,
      isExistingCustomerValid,
      isBookingFormValid,
      isPaymentFormValid
    });
  
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

  openReservationDialog(): void {
    this.filteredRooms = [];
    this.dialog.open(this.reservationDialog, {
      width: '60vw',
      maxWidth: 'none',
      height: '80vh',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    });
  }

  //edits that replaced modal
    // Variable to track current modal page (0: Filter, 1: Room List, 2: Booking Form)
    currentModalPage: number = 0;
  
      // Function to move to the room list view
  goToRoomList() {
    this.currentModalPage = 1;
  }

   // Function to move back to the filter form view
   goToFilterForm() {
    this.currentModalPage = 0;
  }

  populateBookingForm(room: FilteredRoom): void {
    const numberOfDays = this.calculateNumberOfDays(new Date(this.filterForm.get('arrivalDate')?.value), new Date(this.filterForm.get('departureDate')?.value));
    const totalPrice = numberOfDays * room.pricePerDayPerPerson;
  
    this.bookingForm.patchValue({
      reservationId: this.generateReservationId(),
      roomNo: room.roomId,
      stayDateFrom: this.filterForm.get('arrivalDate')?.value,
      stayDateTo: this.filterForm.get('departureDate')?.value,
      numberOfDays,
      totalNumberOfGuests: this.filterForm.get('numberOfGuests')?.value,
      pricePerDayPerPerson: room.pricePerDayPerPerson,
      totalPrice,
    });
  
    // Populate guest options based on room capacity
    this.numberOfGuestsOptions = Array.from({ length: room.guestCapacity }, (_, i) => i + 1);
  }
  

  // Function to close the booking modal (if needed)
  closeBookingModal(): void {
    const reservationModalElement = document.getElementById('reservationModal');
    const bookingElement = document.getElementById('booking');
  
    if (reservationModalElement) {
      const reservationModalInstance = bootstrap.Modal.getInstance(reservationModalElement);
      if (reservationModalInstance) {
        reservationModalInstance.hide();
        reservationModalInstance.dispose();  // Properly dispose of modal
      } else {
        console.warn('Reservation modal instance not found or already disposed.');
      }
    } else {
      console.warn('Reservation modal element not found in the DOM.');
    }
  
    if (bookingElement) {
      const bookingInstance = bootstrap.Modal.getInstance(bookingElement);
      if (bookingInstance) {
        bookingInstance.hide();
        bookingInstance.dispose();  // Properly dispose of booking modal
      } else {
        console.warn('Booking modal instance not found or already disposed.');
      }
    } else {
      console.warn('Booking modal element not found in the DOM.');
    }
  
    // Clean up modal backdrop
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((backdrop) => backdrop.remove());
  
    // Reset the modal's fade and show classes
    document.body.classList.remove('modal-open');
    console.log('Modals Open?', document.querySelectorAll('.modal.show').length);
    console.log('Backdrops Present?', document.querySelectorAll('.modal-backdrop').length);
    this.showToast();
  }

   // Method to show the toast
   showToast(): void {
    const toastElement = document.getElementById('bookingToast');
    if (toastElement) {
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  }
  
  
  goToBookingForm(room: FilteredRoom): void {
    this.selectedRoom = room;
    // Call your existing method to populate the booking form
    this.populateBookingForm(room);
    // Switch to the booking form view
    this.currentModalPage = 2;
  }

  checkFilterButtonState(): void {
    const arrivalDate = this.filterForm.get('arrivalDate')?.value;
    const departureDate = this.filterForm.get('departureDate')?.value;
  
    // No direct assignment needed for `isFilterButtonDisabled`.
    // The form state will automatically enable/disable based on the getter.
  }
  
  
  onSelectionConfirmed(emittedObject: any): void {
    if (emittedObject) {
      // Store the emitted object in the component property
      this.emittedObject = emittedObject;
  
      // Populate form with received dates
      this.filterForm.patchValue({
        arrivalDate: emittedObject.selectedArrivalDate,
        departureDate: emittedObject.selectedDepartureDate,
      });
  
      // Enable the number of guests field
      this.filterForm.get('numberOfGuests')?.enable();
  
      // Extract guest capacities and populate the dropdown
      const guestCapacities = emittedObject.filteredRooms.map((room: { guestCapacity: any; }) => room.guestCapacity);
      const minGuests = Math.min(...guestCapacities);
      const maxGuests = Math.max(...guestCapacities);
  
      this.numberOfGuestsOptions = Array.from({ length: maxGuests - minGuests + 1 }, (_, i) => i + minGuests);
  
      // Call this to update the filter button state
      this.checkFilterButtonState();
    }
  }
generatePDF(): void {
  const { reservation, customer } = this.createReservationObject();  // Getting the object

  const doc = new jsPDF();

  // Define colors
  const paleOrange = '#FFA726';
  const lightGray = '#F2F2F2';
  const black = '#000000';
  const white = '#FFFFFF';

  // Define font sizes
  const largeFontSize = 22;
  const mediumFontSize = 16;
  const smallFontSize = 12;

  // Set background color for header
  doc.setFillColor(paleOrange);
  doc.rect(0, 0, 210, 50, 'F'); // Header rectangle

  // Title: "Maxton"
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(white);
  doc.setFontSize(largeFontSize);
  doc.text('Maxxton', 15, 20); // Title in the center

  // Subheading: "Booking Invoice"
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(smallFontSize);
  doc.text('Booking Invoice', 15, 28); // Below the title

  // Customer Section (adding a light background color)
  doc.setFillColor(lightGray);
  doc.rect(15, 35, 180, 40, 'F'); // Light gray background for customer details

  doc.setFontSize(mediumFontSize);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(black);
  doc.text('Customer Details:', 20, 45);

  doc.setFontSize(smallFontSize);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Name: ${customer.firstName} ${customer.lastName}`, 20, 55);
  doc.text(`Email: ${customer.email}`, 20, 60);
  doc.text(`Mobile: ${customer.mobileNumber1}`, 20, 65);
  doc.text(`Address: ${customer.initialAddress}`, 20, 70);

  // Booking Section
  doc.setFillColor(white);
  doc.setFontSize(mediumFontSize);
  doc.setFont('Helvetica', 'bold');
  doc.text('Booking Details:', 20, 85);

  doc.setFontSize(smallFontSize);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Reservation ID: ${reservation.reservationId}`, 20, 95);
  doc.text(`Room No: ${reservation.roomId}`, 20, 100);
  doc.text(`Arrival Date: ${reservation.arrivalDate}`, 20, 105);
  doc.text(`Departure Date: ${reservation.departureDate}`, 20, 110);
  doc.text(`Guests: ${reservation.numberOfGuest}`, 20, 115);

  // Total Price Section
  doc.setFontSize(mediumFontSize);
  doc.setFont('Helvetica', 'bold');
  doc.text('Payment Summary:', 20, 130);

  doc.setFontSize(smallFontSize);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Total Price: $${reservation.totalPrice.toFixed(2)}`, 20, 140);
  doc.text(`Paid Amount: $${reservation.paidAmount.toFixed(2)}`, 20, 145);
  doc.text(`Due: $${(reservation.totalPrice - reservation.paidAmount).toFixed(2)}`, 20, 150);

  // Footer
  doc.setFontSize(smallFontSize);
  doc.setFont('Helvetica', 'italic');
  doc.text('Thank you for booking with Maxxton!', 15, 280);

  // Save the PDF
  doc.save('Maxxton_Booking_Invoice.pdf');

  // Log the contents (for debugging purposes)
  console.log({
    customer,
    reservation
  });
}

  

  private createReservationObject(): { reservation: Reservation, customer: Customer } {
    const customerId = this.isNewUser ? this.generateCustomerId() : this.existingCustomer?.customerId || '';
    
    // Construct the reservation object
    const reservation: Reservation = {
      reservationId: String(this.bookingForm.get('reservationId')?.value),
      locationId: this.selectedRoom?.locationId || 0,
      roomId: Number(this.bookingForm.get('roomNo')?.value),
      customerId: customerId,
      arrivalDate: this.bookingForm.get('stayDateFrom')?.value,
      departureDate: this.bookingForm.get('stayDateTo')?.value,
      reservationDate: new Date().toISOString(),
      totalPrice: Number(this.bookingForm.get('totalPrice')?.value),
      status: 'CONFIRM',
      paidAmount: Number(this.paymentForm.get('paidAmount')?.value),
      numberOfGuest: Number(this.bookingForm.get('totalNumberOfGuests')?.value),
    };
  
    // Construct the customer object
    let customer: Customer;
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
        mobileNumber2: 0,  // Default
        birthDate: '',
        email: this.customerForm.get('email')?.value,
      };
    } else {
      customer = this.existingCustomer as Customer;
    }
  
    // Return both objects
    return { reservation, customer };
  }
  
  
   // Filter emails based on the input field value
  filterEmails(): void {
    const emailInput = this.emailForm.get('email')?.value.toLowerCase();
    
    if (emailInput.trim() === '') {
      // If the input field is empty, show all emails
      this.filteredEmails = [...this.allEmails];
    } else {
      // If the input is not empty, filter based on the input
      this.filteredEmails = this.allEmails.filter(email =>
        email.toLowerCase().includes(emailInput)
      );
    }

    // Show the dropdown if there's anything to display
    this.emailDropdownVisible = this.filteredEmails.length > 0;
  }

  // Select an email from the dropdown
  selectEmail(email: string): void {
    // Patch the selected email into the email input field
    this.emailForm.patchValue({ email });

    // Hide the dropdown after selection
    this.emailDropdownVisible = false;

    // Fetch existing customer details based on the selected email
    this.fetchExistingCustomer();
  }
  
  
  
}



function html2canvas(elementToCapture: HTMLElement) {
  throw new Error('Function not implemented.');
}
