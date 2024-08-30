import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalDataSubject = new BehaviorSubject<any>(null);
  modalData$ = this.modalDataSubject.asObservable();

  setModalData(data: any) {
    this.modalDataSubject.next(data);
  }

  clearModalData() {
    this.modalDataSubject.next(null);
  }
}
