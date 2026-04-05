import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PartnerBookingListResponse,
  PartnerCalendarResponse,
  PartnerHotel,
  PartnerInventoryUpdateRequest,
  PartnerPayoutListResponse,
  PartnerPricingCalendarResponse,
  PartnerPricingUpdateRequest,
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
    return this.http.get<PartnerRoomListResponse>(`${environment.apiUrl}/partner/room-types`);
  }

  createRoom(payload: Partial<PartnerRoom>): Observable<PartnerRoom> {
    return this.http.post<PartnerRoom>(`${environment.apiUrl}/partner/room-types`, payload);
  }

  updateRoom(roomId: number, payload: Partial<PartnerRoom>): Observable<PartnerRoom> {
    return this.http.put<PartnerRoom>(`${environment.apiUrl}/partner/room-types/${roomId}`, payload);
  }

  deleteRoom(roomId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/partner/room-types/${roomId}`);
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

  getCalendar(roomId: number, startDate?: string): Observable<PartnerCalendarResponse> {
    return this.http.get<PartnerCalendarResponse>(`${environment.apiUrl}/partner/calendar`, {
      params: startDate ? { room_type_id: roomId, start_date: startDate } : { room_type_id: roomId },
    });
  }

  updateInventory(payload: PartnerInventoryUpdateRequest): Observable<PartnerCalendarResponse> {
    return this.http.put<PartnerCalendarResponse>(`${environment.apiUrl}/partner/calendar`, payload);
  }

  blockInventory(payload: PartnerInventoryUpdateRequest): Observable<PartnerCalendarResponse> {
    return this.http.post<PartnerCalendarResponse>(`${environment.apiUrl}/partner/inventory/block`, payload);
  }

  unblockInventory(payload: PartnerInventoryUpdateRequest): Observable<PartnerCalendarResponse> {
    return this.http.post<PartnerCalendarResponse>(`${environment.apiUrl}/partner/inventory/unblock`, payload);
  }

  getPricingCalendar(roomId: number, startDate?: string): Observable<PartnerPricingCalendarResponse> {
    return this.http.get<PartnerPricingCalendarResponse>(`${environment.apiUrl}/partner/pricing/calendar`, {
      params: startDate ? { room_type_id: roomId, start_date: startDate } : { room_type_id: roomId },
    });
  }

  updatePricing(payload: PartnerPricingUpdateRequest): Observable<PartnerPricingCalendarResponse> {
    return this.http.post<PartnerPricingCalendarResponse>(`${environment.apiUrl}/partner/pricing`, payload);
  }
}
