import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DualCalendarTriggerService {
  // Observable to notify that initialization has started
  private initializeSubject = new Subject<void>();
  initialize$ = this.initializeSubject.asObservable();

  // Method to trigger the initialization
  initialize(): void {
    console.log('DualCalendarComponent is being initialized');
    this.initializeSubject.next();
  }
}
