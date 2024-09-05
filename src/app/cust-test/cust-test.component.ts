import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Customer } from '../Interfaces/reservation';
@Component({
  selector: 'app-cust-test',
  templateUrl: './cust-test.component.html',
  styleUrl: './cust-test.component.css'
})



export class CustomerFormComponent implements OnInit {
  existingCustomerForm!: FormGroup;
  newCustomerForm!: FormGroup;
  showExistingCustomerForm = false;
  showNewCustomerForm = false;
  customerData: Customer | null = null;
  reservationsData: any[] = [];
  welcomeMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationStorageService
  ) {}

  ngOnInit(): void {
    this.existingCustomerForm = this.fb.group({
      customerId: ['']
    });

    this.newCustomerForm = this.fb.group({
      customerId: [''],
      age: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      country: [''],
      state: [''],
      city: [''],
      pinCode: [''],
      initialAddress: [''],
      mobileNumber1: [''],
      mobileNumber2: [''],
      birthDate: ['']
    });
  }

  onExistingCustomer(): void {
    this.showExistingCustomerForm = true;
    this.showNewCustomerForm = false;
    this.resetCustomerData();
  }

  onNewCustomer(): void {
    this.showExistingCustomerForm = false;
    this.showNewCustomerForm = true;
    this.resetCustomerData();
  }

  fetchCustomerData(): void {
    const customerId = this.existingCustomerForm.get('customerId')?.value;
    const customer = this.reservationService.getCustomerById(customerId);

    if (customer) {
      this.customerData = customer;
      this.welcomeMessage = `Welcome, ${customer.firstName} ${customer.lastName}`;
      this.reservationsData = this.reservationService.getReservations().filter(
        res => res.customer.customerId === customerId
      );
    } else {
      console.error('Customer not found');
      this.welcomeMessage = '';
      this.customerData = null;
      this.reservationsData = [];
    }
  }

  saveNewCustomer(): void {
    const newCustomer = this.newCustomerForm.value as Customer;
    console.log('New Customer Data:', newCustomer);
    // Optionally, save the new customer data using a service method
  }

  private resetCustomerData(): void {
    this.customerData = null;
    this.welcomeMessage = '';
    this.reservationsData = [];
  }
}
