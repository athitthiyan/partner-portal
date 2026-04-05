import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PartnerBookingListResponse,
  PartnerCalendarResponse,
  PartnerHotel,
  PartnerPayoutListResponse,
  PartnerRevenueSummary,
  PartnerRoom,
  PartnerRoomListResponse,
} from '../models/partner.model';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private http = inject(HttpClient);

  getHotel(): Observable<PartnerHotel> {
    return this.http.get<PartnerHotel>(`${environment.apiUrl}/partner/hotel`);
  }

  updateHotel(payload: Partial<PartnerHotel> & { bank_account_number?: string }): Observable<PartnerHotel> {
    return this.http.put<PartnerHotel>(`${environment.apiUrl}/partner/hotel`, payload);
  }

  getRooms(): Observable<PartnerRoomListResponse> {
    return this.http.get<PartnerRoomListResponse>(`${environment.apiUrl}/partner/rooms`);
  }

  createRoom(payload: Partial<PartnerRoom>): Observable<PartnerRoom> {
    return this.http.post<PartnerRoom>(`${environment.apiUrl}/partner/rooms`, payload);
  }

  getBookings(): Observable<PartnerBookingListResponse> {
    return this.http.get<PartnerBookingListResponse>(`${environment.apiUrl}/partner/bookings`);
  }

  getRevenue(): Observable<PartnerRevenueSummary> {
    return this.http.get<PartnerRevenueSummary>(`${environment.apiUrl}/partner/revenue`);
  }

  getPayouts(): Observable<PartnerPayoutListResponse> {
    return this.http.get<PartnerPayoutListResponse>(`${environment.apiUrl}/partner/payouts`);
  }

  getCalendar(roomId: number): Observable<PartnerCalendarResponse> {
    return this.http.get<PartnerCalendarResponse>(`${environment.apiUrl}/partner/calendar`, {
      params: { room_id: roomId },
    });
  }
}
