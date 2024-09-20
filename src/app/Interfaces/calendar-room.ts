import { Stay } from "./stay";

export interface CalendarRoom {
    roomId: number;
    locationId: number;
    locationName: string;
    roomName: string;
    pricePerDayPerPerson: number;
    guestCapacity: number;
    selectedStay?: Stay; // The stay that matched the criteria
  }