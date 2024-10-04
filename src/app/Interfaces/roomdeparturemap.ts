import { Stay } from "./stay";

export interface RoomDepartureMap {
    [roomId: number]: {
      [arrivalDate: string]: {
        [validDeparture: string]: Stay; // Key: valid departure date, Value: specific Stay
      };
    };
  }