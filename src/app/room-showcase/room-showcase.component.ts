// // room-showcase.component.ts
// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup } from '@angular/forms';
// import { RoomService } from '../services/room.service';
// import { StayService } from '../services/stays.service';
// import { Stay } from '../Interfaces/stay';
// import { Room } from '../Interfaces/room';

// @Component({
//   selector: 'app-room-showcase',
//   templateUrl: './room-showcase.component.html',
//   styleUrls: ['./room-showcase.component.css']
// })
// export class RoomShowcaseComponent implements OnInit {
//   rooms: Room[] = [];
//   stays: Stay[] = [];
//   filteredRooms: Room[] = [];
//   searchForm: FormGroup;
//   filterForm: FormGroup;
//   locations: string[] = [];

//   constructor(
//     private roomService: RoomService,
//     private stayService: StayService,
//     private fb: FormBuilder
//   ) {
//     this.searchForm = this.fb.group({
//       location: [''],
//       stayDateFrom: [''],
//       stayDateTo: ['']
//     });

//     this.filterForm = this.fb.group({
//       numberOfPersons: [0],
//       maxPrice: [0]
//     });
//   }

//   ngOnInit(): void {
//     this.roomService.getRooms().subscribe(roomData => {
//       this.rooms = roomData;
//       this.stayService.getStays().subscribe(stayData => {
//         this.stays = stayData;
//         this.mergeData();
//         this.initializeLocations();
//         this.applyFilters(); // Initial filter application
//       });
//     });
//   }

//   mergeData(): void {
//     const roomMap = new Map<number, Room>();

//     this.rooms.forEach(room => {
//       if (!roomMap.has(room.roomId)) {
//         roomMap.set(room.roomId, { ...room, stays: [], availability: [] });
//       }
//     });

//     this.stays.forEach(stay => {
//       const room = roomMap.get(stay.roomId);
//       if (room) {
//         room.stays.push(stay);
//         const availabilityDetail = `From: ${stay.stayDateFrom}, To: ${stay.stayDateTo}`;
//         if (!room.availability.includes(availabilityDetail)) {
//           room.availability.push(availabilityDetail);
//         }
//       }
//     });

//     this.filteredRooms = Array.from(roomMap.values());
//   }

//   initializeLocations(): void {
//     const uniqueLocations = Array.from(new Set(this.rooms.map(room => room.locationName)));
//     this.locations = uniqueLocations;
//   }

//   applySearch(): void {
//     const searchFilters = this.searchForm.value;

//     const availabilityMap = new Map<number, string[]>();

//     this.filteredRooms.forEach(room => {
//       availabilityMap.set(room.roomId, room.availability);
//     });

//     this.filteredRooms = [...this.rooms];

//     if (searchFilters.location.trim()) {
//       this.filteredRooms = this.filteredRooms.filter(room =>
//         room.locationName.toLowerCase().includes(searchFilters.location.toLowerCase())
//       );
//     }

//     if (searchFilters.stayDateFrom || searchFilters.stayDateTo) {
//       const arrivalDate = searchFilters.stayDateFrom ? new Date(searchFilters.stayDateFrom) : null;
//       const departureDate = searchFilters.stayDateTo ? new Date(searchFilters.stayDateTo) : null;

//       if (arrivalDate && departureDate) {
//         this.filteredRooms = this.filteredRooms.filter(room => {
//           const stays = this.stays.filter(stay => stay.roomId === room.roomId);
//           const isAvailable = stays.some(stay => {
//             const stayFrom = new Date(stay.stayDateFrom);
//             const stayTo = new Date(stay.stayDateTo);
//             const isDateOverlap = stayFrom <= departureDate && stayTo >= arrivalDate;

//             if (isDateOverlap) {
//               const stayDuration = (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24) + 1;
//               const isStayDurationMatch = stayDuration >= stay.minStay && stayDuration <= stay.maxStay;
//               return isStayDurationMatch;
//             }

//             return false;
//           });

//           return isAvailable;
//         });
//       }
//     }

//     this.filteredRooms = this.filteredRooms.map(room => ({
//       ...room,
//       availability: availabilityMap.get(room.roomId) || []
//     }));

//     console.log('Filtered Rooms after Search:', this.filteredRooms);
//   }

//   applyFilters(): void {
//     const filters = this.filterForm.value;

//     const availabilityMap = new Map<number, string[]>();

//     this.filteredRooms.forEach(room => {
//       availabilityMap.set(room.roomId, room.availability);
//     });

//     if (filters.numberOfPersons > 0) {
//       this.filteredRooms = this.filteredRooms.filter(room =>
//         room.guestCapacity >= filters.numberOfPersons
//       );
//     }

//     if (filters.maxPrice > 0) {
//       this.filteredRooms = this.filteredRooms.filter(room =>
//         room.pricePerDayPerPerson <= filters.maxPrice
//       );
//     }

//     this.filteredRooms = this.filteredRooms.map(room => ({
//       ...room,
//       availability: availabilityMap.get(room.roomId) || []
//     }));

//     console.log('Filtered Rooms after Filter:', this.filteredRooms);
//   }
// }
