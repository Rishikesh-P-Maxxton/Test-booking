import { Component, OnInit } from '@angular/core';
import { ReservationStorageService } from '../services/reservation-storage.service';
import { Reservation, Customer } from '../Interfaces/reservation';
import jsPDF from 'jspdf';  // Import jsPDF
import autoTable from 'jspdf-autotable';  // Import autoTable for table generation

@Component({
  selector: 'app-reservations-list',
  templateUrl: './reservations-list.component.html',
  styleUrls: ['./reservations-list.component.css']
})
export class ReservationsListComponent implements OnInit {

  reservations: Array<{ reservation: Reservation, customer: Customer }> = [];
  filteredReservations: Array<{ reservation: Reservation, customer: Customer }> = [];  // Filtered reservations
  filterTerm: string = '';  // For search functionality
  sortDirection: boolean = true;  // Toggle sort order

  constructor(private reservationStorageService: ReservationStorageService) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservations = this.reservationStorageService.getReservations();
    this.applyFilter();  // Apply filter initially to display all reservations
  }

  // Apply search filter
  applyFilter(): void {
    const searchTerm = this.filterTerm.toLowerCase();
    this.filteredReservations = this.reservations.filter(res => {
      const customerName = `${res.customer.firstName} ${res.customer.middleName ?? ''} ${res.customer.lastName}`.toLowerCase();
      const roomId = res.reservation.roomId.toString();
      const status = res.reservation.status.toLowerCase();
      
      return customerName.includes(searchTerm) || roomId.includes(searchTerm) || status.includes(searchTerm);
    });
  }

  // Sorting functionality
  sortBy(field: keyof Reservation): void {
    this.sortDirection = !this.sortDirection;  // Toggle sort direction
    this.filteredReservations.sort((a, b) => {
      const valueA = a.reservation[field];
      const valueB = b.reservation[field];

      if (valueA < valueB) return this.sortDirection ? -1 : 1;
      if (valueA > valueB) return this.sortDirection ? 1 : -1;
      return 0;
    });
  }

  // Update reservation status
  updateStatus(reservationToUpdate: { reservation: Reservation, customer: Customer }): void {
    if (!reservationToUpdate || !reservationToUpdate.reservation) {
      console.error('Invalid reservation object:', reservationToUpdate);
      return;
    }

    reservationToUpdate.reservation.status = reservationToUpdate.reservation.status;
    this.reservationStorageService.saveReservation(reservationToUpdate);
    this.loadReservations();
  }

  // Delete a reservation
  deleteReservation(reservationId: string): void {
    this.reservationStorageService.deleteReservation(reservationId);
    this.loadReservations();
  }

  // Clear all reservations
  clearReservations(): void {
    this.reservationStorageService.clearReservations();
    this.loadReservations();
  }

  // PDF Generation functionality
  downloadPDF(): void {
    const doc = new jsPDF();

    // Add title and header
    doc.setFontSize(22);
    doc.setTextColor('#ff6600'); // Orange color for Maxxton
    doc.text('Maxxton', 14, 22);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);  // Black color
    doc.text('Reservations List', 14, 30);

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
    doc.save(`Reservations_List_${currentDate}.pdf`);
  }

  currentPage: number = 1; // Current page number
itemsPerPage: number = 7; // Items per page (can be adjusted based on preference)

// Calculated getter to determine total pages based on the filtered data length
get totalPages(): number {
  return Math.ceil(this.filteredReservations.length / this.itemsPerPage);
}
// Method to get the paginated data
get paginatedReservations(): Array<{ reservation: Reservation, customer: Customer }> {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  return this.filteredReservations.slice(startIndex, endIndex);
}

// Method to navigate to a specific page
goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
  }
}

selectedReservation: { reservation: Reservation, customer: Customer } | null = null; // For modal

openModal(reservation: { reservation: Reservation, customer: Customer } | null): void {
  if (reservation) {
    this.selectedReservation = reservation;
    console.log('Opening modal for reservation:', reservation);

    const modalElement = document.getElementById('reservationDetailsModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      console.log('Modal is shown');
    } else {
      console.error('Modal element not found');
    }
  } else {
    console.error('Reservation not provided');
  }
}


}
