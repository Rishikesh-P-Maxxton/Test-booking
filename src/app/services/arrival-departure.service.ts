import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Stay } from '../Interfaces/stay';

interface RoomDepartureMap {
  [roomId: number]: {
    [arrivalDate: string]: {
      [validDeparture: string]: Stay; // Key: valid departure date, Value: specific Stay
    };
  };
}

@Injectable({
  providedIn: 'root' // Makes this service available across the entire application
})
export class ArrivalDepartureService {
  // BehaviorSubject to hold the room departure map
  private roomDepartureMapSubject = new BehaviorSubject<RoomDepartureMap | null>(null);

  // Observable property for other components to subscribe to
  roomDepartureMap$ = this.roomDepartureMapSubject.asObservable();

  constructor() {}

  // Method to update the room departure map
  setRoomDepartureMap(data: RoomDepartureMap): void {
    this.roomDepartureMapSubject.next(data);
  }

  // Optional: Method to get the current value without subscribing
  getRoomDepartureMap(): RoomDepartureMap | null {
    return this.roomDepartureMapSubject.getValue();
  }
}
