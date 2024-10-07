import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterStateService {
  private resetFilterSubject = new BehaviorSubject<boolean>(false);
  resetFilterAction$ = this.resetFilterSubject.asObservable();

  triggerFilterReset() {
    this.resetFilterSubject.next(true);
  }
}
