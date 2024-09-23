import { Component, OnInit } from '@angular/core';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Reservation, Customer } from '../Interfaces/reservation';
import jsPDF from 'jspdf';  // Import jsPDF
import autoTable from 'jspdf-autotable';  // Import autoTable for table generation

@Component({
  selector: 'app-booking-history',
  templateUrl: './booking-history.component.html',
  styleUrls: ['./booking-history.component.css']
})
export class BookingHistoryComponent implements OnInit {

  reservations: Array<{ reservation: Reservation, customer: Customer }> = [];
  filteredReservations: Array<{ reservation: Reservation, customer: Customer }> = [];
  filterTerm: string = ''; // For search functionality
  selectedReservation: { reservation: Reservation, customer: Customer } | null = null; // For modal
  sortDirection: boolean = true; // Toggle sort order

  constructor(private reservationStorageService: ReservationStorageService) {}

  ngOnInit(): void {
    this.loadBookingHistory();
  }

  loadBookingHistory(): void {
    this.reservations = this.reservationStorageService.getBookingHistory();
    this.applyFilter(); // Apply filter initially to display all reservations
  }

  applyFilter(): void {
    const searchTerm = this.filterTerm.toLowerCase();
    this.filteredReservations = this.reservations.filter(res => {
      const customerName = `${res.customer.firstName} ${res.customer.middleName ?? ''} ${res.customer.lastName}`.toLowerCase();
      const roomId = res.reservation.roomId.toString();
      const email = res.customer.email.toLowerCase();
      
      return customerName.includes(searchTerm) || roomId.includes(searchTerm) || email.includes(searchTerm);
    });
  }

  sortBy(field: keyof Reservation): void {
    this.sortDirection = !this.sortDirection; // Toggle sort direction
    this.filteredReservations.sort((a, b) => {
      const valueA = a.reservation[field];
      const valueB = b.reservation[field];

      if (valueA < valueB) return this.sortDirection ? -1 : 1;
      if (valueA > valueB) return this.sortDirection ? 1 : -1;
      return 0;
    });
  }

  openModal(reservation: { reservation: Reservation, customer: Customer } | null): void {
    if (reservation) {
      this.selectedReservation = reservation;
      const modalElement = document.getElementById('reservationModal');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }

  // Show the toast instead of modal
  showToast(): void {
    const toastElement = document.getElementById('confirmationToast');
    if (toastElement) {
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  }

  // Confirm the clearing of reservations and hide the toast
  confirmClearReservations(): void {
    this.reservationStorageService.clearBookingHistory();
    this.loadBookingHistory();
    const toastElement = document.getElementById('confirmationToast');
    if (toastElement) {
      const toast = bootstrap.Toast.getInstance(toastElement);
      toast?.hide();
    }
  }

  downloadPDF(): void {
    const doc = new jsPDF();

    // Add title and header
    doc.setFontSize(22);
    doc.setTextColor('#ff6600'); // Orange color for Maxxton
    doc.text('Maxxton', 14, 22);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);  // Black color
    doc.text('Booking History', 14, 30);

    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 14, 36);

    // Generate table data
    autoTable(doc, {
      head: [['Reservation ID', 'Room ID', 'Stay From', 'Stay To', 'Total Guests', 'Total Price', 'Customer Name', 'Status', 'Paid Amount']],
      body: this.filteredReservations.map(res => [
        res.reservation.reservationId,
        res.reservation.roomId,
        res.reservation.arrivalDate,
        res.reservation.departureDate,
        res.reservation.numberOfGuest,
        res.reservation.totalPrice,
        `${res.customer.firstName} ${res.customer.middleName ?? ''} ${res.customer.lastName}`,
        res.reservation.status,
        res.reservation.paidAmount,
      ]),
      startY: 42,
      styles: {
        font: 'helvetica',
        fontSize: 10,
      },
      headStyles: {
        fillColor: [255, 102, 0], // Orange header color
        textColor: [255, 255, 255],  // White text
      },
      margin: { top: 50 },
    });

    // Save the PDF
    doc.save(`Booking_History_${currentDate}.pdf`);
  }
}
