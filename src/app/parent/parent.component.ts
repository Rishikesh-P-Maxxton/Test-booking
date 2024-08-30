// parent.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-parent',
  templateUrl: './parent.component.html',
  styleUrls: ['./parent.component.css']
})
export class ParentComponent {
  reservationId = '12345';  // Example reservation ID
       
  stayDateFrom = new Date(); // Example start date
  stayDateTo = new Date();   // Example end date

  roomId: number =2;

  openBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();
    }
  }
}
