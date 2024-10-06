import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  // Method to get the optimized room departure map as an observable
  getOptimizedRoomDepartureMap(): Observable<RoomDepartureMap | null> {
    return new Observable(observer => {
      this.roomDepartureMap$.subscribe(map => {
        if (map) {
          const optimizedMap = this.optimizeRoomDepartureMap(map);
          observer.next(optimizedMap);
        } else {
          observer.next(null);
        }
      });
    });
  }

  // Method to optimize the room departure map by removing unnecessary values
  private optimizeRoomDepartureMap(map: RoomDepartureMap): RoomDepartureMap {
    const optimizedMap: RoomDepartureMap = {};

    Object.keys(map).forEach(roomIdKey => {
      const roomId = Number(roomIdKey);
      const arrivalDates = map[roomId];
      const filteredArrivalDates: { [arrivalDate: string]: { [departureDate: string]: Stay } } = {};

      Object.keys(arrivalDates).forEach(arrivalDate => {
        const departures = arrivalDates[arrivalDate];

        // Filter out empty departures
        const validDepartures: { [departureDate: string]: Stay } = {};
        Object.keys(departures).forEach(departureDate => {
          const stay = departures[departureDate];
          if (stay) {
            validDepartures[departureDate] = stay;
          }
        });

        // Only include arrivalDates that have at least one valid departure
        if (Object.keys(validDepartures).length > 0) {
          filteredArrivalDates[arrivalDate] = validDepartures;
        }
      });

      // Only include room IDs that have at least one valid arrival date
      if (Object.keys(filteredArrivalDates).length > 0) {
        optimizedMap[roomId] = filteredArrivalDates;
      }
    });

    return optimizedMap;
  }
}
