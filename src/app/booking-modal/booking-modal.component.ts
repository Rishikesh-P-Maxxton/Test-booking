import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Room } from '../Interfaces/room';
import { Reservation, Customer } from '../Interfaces/reservation';
import { ReservationStorageService } from '../services/reservation-storage.service';

@Component({
  selector: 'app-booking-modal',
  templateUrl: './booking-modal.component.html',
  styleUrls: ['./booking-modal.component.scss']
})
export class BookingModalComponent {
  @Input() selectedRoom: Room | null = null;
  @Input() startDate: Date| null = null;
  @Input() endDate: Date| null = null;
  @Output() closeModal = new EventEmitter<void>();

  bookingForm: FormGroup;
  customerForm: FormGroup;
  paymentForm: FormGroup;
  isConfirmDisabled = true;

  constructor(
    private fb: FormBuilder,
    private reservationStorageService: ReservationStorageService
  ) {
    this.bookingForm = this.fb.group({
      reservationId: [{ value: '', disabled: true }],
      roomNo: [{ value: '', disabled: true }],
      stayDateFrom: [{ value: '', disabled: true }],
      stayDateTo: [{ value: '', disabled: true }],
      numberOfDays: [{ value: 0, disabled: true }],
      totalNumberOfGuests: [1, [Validators.required, Validators.min(1)]],
      pricePerDayPerPerson: [{ value: 0, disabled: true }],
      totalPrice: [{ value: 0, disabled: true }],
    });

    this.customerForm = this.fb.group({
      customerId: ['', Validators.required],
      name: ['', Validators.required],
      age: ['', Validators.required],
      initialAddress: ['', Validators.required],
      mobileNumber: ['', Validators.required],
      pincode: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentId: [{ value: '', disabled: true }],
      paymentMode: ['', Validators.required],
      paidAmount: [0, Validators.required],
      due: [0, Validators.required],
    });

    this.bookingForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
    this.customerForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
    this.paymentForm.valueChanges.subscribe(() => this.updateConfirmButtonState());
  }

  ngOnInit(): void {
    this.initializeForms();
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

  confirmBooking(): void {
    if (this.bookingForm.valid && this.customerForm.valid && this.paymentForm.valid && !this.isConfirmDisabled) {
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

      const customer: Customer = {
        customerId: String(this.customerForm.get('customerId')?.value),
        age: Number(this.customerForm.get('age')?.value),
        firstName: this.customerForm.get('name')?.value.split(' ')[0],
        middleName: this.customerForm.get('name')?.value.split(' ')[1] || '',
        lastName: this.customerForm.get('name')?.value.split(' ')[2] || '',
        country: this.customerForm.get('country')?.value,
        state: this.customerForm.get('state')?.value,
        city: this.customerForm.get('city')?.value,
        pinCode: Number(this.customerForm.get('pincode')?.value),
        initialAddress: this.customerForm.get('initialAddress')?.value,
        mobileNumber1: Number(this.customerForm.get('mobileNumber')?.value),
        mobileNumber2: 0,
        birthDate: '',
      };

      const reservationData = {
        reservation: reservation,
        customer: customer,
      };

      this.reservationStorageService.saveReservation(reservationData);
      this.closeModal.emit();
    }
  }
}
