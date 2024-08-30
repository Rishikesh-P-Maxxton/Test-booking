import { Injectable } from '@angular/core';
import { BookingDetails } from '../Interfaces/booking-details';
// Adjust path as necessary

@Injectable({
  providedIn: 'root'
})
export class ModalDataService {
  private data: BookingDetails | null = null;

  setData(data: BookingDetails): boolean {
    this.data = data;
    return data != null;
  }

  getData(): BookingDetails | null {
    return this.data;
  }

  clearData(): void {
    this.data = null;
  }
}
