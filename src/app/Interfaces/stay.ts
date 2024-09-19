export interface Stay {
    stayDateFrom: string;
    stayDateTo: string;
    arrivalDays: string[];
    departureDays: string[];
    minStay: number;
    maxStay: number;
    roomId: number;
    bookDateFrom?: Date; // Optional: booking window start date
    bookDateTo?: Date; // Optional: booking window end date
    minDeviation?: number; // Minimum deviation (days from today)
    maxDeviation?: number; // Maximum deviation (days from today)
  }