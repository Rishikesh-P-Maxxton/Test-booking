import { Component, OnInit, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { GeolocsService } from '../services/geolocs.service';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Observable } from 'rxjs';
import { Customer, Reservation } from '../Interfaces/reservation';

@Component({
  selector: 'app-booking-modal',
  templateUrl: './booking-modal.component.html',
  styleUrls: ['./booking-modal.component.scss']
})
export class BookingModalComponent implements OnInit {
  @ViewChild('stepper') stepper: MatStepper | undefined;
  @ViewChild('modal') modal: ElementRef | undefined;

  bookingForm: FormGroup;
  customerForm: FormGroup;
  paymentForm: FormGroup;
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  numberOfGuestsOptions: number[] = [1, 2, 3, 4, 5, 6];
  isConfirmDisabled = true;

  @Input() selectedRoom: any; // Adjust based on your Room interface
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Output() closeModalEvent = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private geolocsService: GeolocsService,
    private reservationStorageService: ReservationStorageService
  ) {
    this.bookingForm = this.fb.group({
      reservationId: [{ value: '', disabled: true }],
      roomNo: [{ value: '', disabled: true }],
      stayDateFrom: [''],
      stayDateTo: [''],
      numberOfDays: [{ value: '', disabled: true }],
      totalNumberOfGuests: [''],
      pricePerDayPerPerson: [{ value: '', disabled: true }],
      totalPrice: [{ value: '', disabled: true }]
    });

    this.customerForm = this.fb.group({
      customerId: [{ value: '', disabled: true }],
      name: [''],
      age: [''],
      initialAddress: [''],
      mobileNumber: [''],
      pincode: [''],
      country: [''],
      state: [''],
      city: ['']
    });

    this.paymentForm = this.fb.group({
      paymentId: [{ value: '', disabled: true }],
      paymentMode: [''],
      paidAmount: [''],
      due: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadGeolocations();
  }

  private initializeForms(): void {
    if (this.selectedRoom) {
      this.bookingForm.patchValue({
        reservationId: this.generateReservationId(),
        roomNo: this.selectedRoom.roomId,
        stayDateFrom: this.startDate,
        stayDateTo: this.endDate,
        pricePerDayPerPerson: this.selectedRoom.pricePerDayPerPerson,
      });
      this.updateTotalPrice();
    }
  }

  private loadGeolocations(): void {
    this.geolocsService.getData().subscribe(data => {
      this.countries = data.countries;
    });
  }

  public updateTotalPrice(): void {
    const numberOfDays = this.getNumberOfDays();
    const pricePerDayPerPerson = this.bookingForm.get('pricePerDayPerPerson')?.value;
    const totalPrice = numberOfDays * pricePerDayPerPerson;
    this.bookingForm.get('totalPrice')?.setValue(totalPrice, { emitEvent: false });
  }

  private getNumberOfDays(): number {
    const start = new Date(this.bookingForm.get('stayDateFrom')?.value);
    const end = new Date(this.bookingForm.get('stayDateTo')?.value);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  }

  private generateReservationId(): string {
    return 'RES' + Math.floor(Math.random() * 1000000);
  }

  updateConfirmButtonState(): void {
    const formValid =
      this.bookingForm.valid &&
      this.customerForm.valid &&
      this.paymentForm.valid;
    this.isConfirmDisabled = !formValid;
  }

  onCountryChange(event: Event): void {
    const countryId = (event.target as HTMLSelectElement).value;
    const selectedCountry = this.countries.find(country => country.countryId === countryId);
    this.states = selectedCountry ? selectedCountry.states : [];
    this.cities = [];
    this.customerForm.patchValue({ state: '', city: '' });
    this.updateConfirmButtonState();
  }

  onStateChange(event: Event): void {
    const stateId = (event.target as HTMLSelectElement).value;
    const selectedState = this.states.find(state => state.stateId === stateId);
    this.cities = selectedState ? selectedState.cities : [];
    this.customerForm.patchValue({ city: '' });
    this.updateConfirmButtonState();
  }
  confirmBooking(): void {
    if (this.bookingForm.valid && this.customerForm.valid && this.paymentForm.valid && !this.isConfirmDisabled) {
      const reservation: Reservation = {
        reservationId: this.bookingForm.get('reservationId')?.value,
        locationId: this.selectedRoom?.locationId || 0,
        roomId: Number(this.bookingForm.get('roomNo')?.value),
        customerId: this.customerForm.get('customerId')?.value,
        arrivalDate: this.bookingForm.get('stayDateFrom')?.value,
        departureDate: this.bookingForm.get('stayDateTo')?.value,
        reservationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        totalPrice: Number(this.bookingForm.get('totalPrice')?.value),
        status: 'CONFIRM', // Ensure this matches one of the allowed values
        paidAmount: Number(this.paymentForm.get('paidAmount')?.value),
        numberOfGuest: Number(this.bookingForm.get('totalNumberOfGuests')?.value),
      };
  
      const customer: Customer = {
        customerId: this.customerForm.get('customerId')?.value,
        age: Number(this.customerForm.get('age')?.value),
        firstName: this.customerForm.get('name')?.value.split(' ')[0] || '',
        middleName: this.customerForm.get('name')?.value.split(' ')[1] || '',
        lastName: this.customerForm.get('name')?.value.split(' ')[2] || '',
        country: this.customerForm.get('country')?.value,
        state: this.customerForm.get('state')?.value,
        city: this.customerForm.get('city')?.value,
        pinCode: Number(this.customerForm.get('pincode')?.value),
        initialAddress: this.customerForm.get('initialAddress')?.value,
        mobileNumber1: Number(this.customerForm.get('mobileNumber')?.value),
        mobileNumber2: 0, // Assuming you don't use a second mobile number
        birthDate: '', // Set to a default or appropriate value if available
      };
  
      const reservationData = {
        reservation,
        customer,
      };
  
      this.reservationStorageService.saveReservation(reservationData);
      this.closeModal();
    }
  }
  

  closeModal(): void {
    if (this.modal) {
      const modalElement = this.modal.nativeElement as HTMLElement;
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
    this.closeModalEvent.emit();
  }
}
