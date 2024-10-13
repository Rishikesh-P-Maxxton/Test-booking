import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  
  private roomsUrl = 'https://jadhavsudhit.github.io/Booking-module/rooms.json';

  constructor(private http: HttpClient) {}

  getRooms(): Observable<any[]> {
    return this.http.get<any[]>(this.roomsUrl);
  }

  // Get room by roomId
  getRoomById(roomId: number): Observable<any | undefined> {
    return this.getRooms().pipe(
      // Use the map operator to find the room with the specified roomId
      map((rooms: any[]) => rooms.find(room => room.roomId === roomId))
    );
  }
}
