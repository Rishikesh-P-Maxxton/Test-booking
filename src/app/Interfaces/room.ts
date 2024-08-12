import { Stay } from "./stay";

export interface Room {
    roomId: number;
    locationId: number;
    locationName: string;
    pricePerDayPerPerson: number;
    guestCapacity: number;
    roomName: string;
    stays: Stay[];
    availability: string[];
  }