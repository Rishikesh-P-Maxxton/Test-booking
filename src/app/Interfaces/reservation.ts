export interface Reservation {
    reservationId: string;
    locationId: number;
    roomId: number;
    customerId: string;
    arrivalDate: string; // "YYYY-MM-DD"
    departureDate: string; // "YYYY-MM-DD"
    reservationDate: string; // "YYYY-MM-DD HH:MM:SS"
    totalPrice: number;
    status: ReservationStatus;
    paidAmount: number;
    numberOfGuest: number;
  }
 
export type ReservationStatus = "CONFIRM" | "CHECKED-IN" | "CHECKED-OUT";

  export interface Customer {
    customerId: string;
    age: number;
    birthDate: string; // "YYYY-MM-DD"
    firstName: string;
    middleName: string;
    lastName: string;
    country: string;
    state: string;
    city: string;
    pinCode: number;
    initialAddress: string;
    mobileNumber1: number;
    mobileNumber2: number;
  }

  