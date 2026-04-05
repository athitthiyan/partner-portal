import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PartnerService } from './partner.service';
import { environment } from '../../../environments/environment';
import { PartnerRoom } from '../models/partner.model';

describe('PartnerService', () => {
  let service: PartnerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PartnerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('gets the partner hotel profile', () => {
    service.getHotel().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/hotel`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('updates the partner hotel profile', () => {
    const payload = { display_name: 'Stayvora Marina Suites', bank_account_number: '12345678' };

    service.updateHotel(payload).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/hotel`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('gets partner rooms', () => {
    service.getRooms().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/room-types`);
    expect(request.request.method).toBe('GET');
    request.flush({ rooms: [], total: 0 });
  });

  it('creates a partner room', () => {
    const payload: Partial<PartnerRoom> = { room_type: 'suite', price: 3500 };

    service.createRoom(payload).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/room-types`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('updates and deletes a partner room type', () => {
    service.updateRoom(9, { room_type_name: 'Family Room' }).subscribe();
    const updateRequest = http.expectOne(`${environment.apiUrl}/partner/room-types/9`);
    expect(updateRequest.request.method).toBe('PUT');
    updateRequest.flush({});

    service.deleteRoom(9).subscribe();
    const deleteRequest = http.expectOne(`${environment.apiUrl}/partner/room-types/9`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({});
  });

  it('gets partner bookings', () => {
    service.getBookings().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/bookings`);
    expect(request.request.method).toBe('GET');
    request.flush({ bookings: [], total: 0 });
  });

  it('gets partner revenue summary', () => {
    service.getRevenue().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/revenue`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('gets partner payouts', () => {
    service.getPayouts().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/payouts`);
    expect(request.request.method).toBe('GET');
    request.flush({ payouts: [], total: 0 });
  });

  it('gets calendar data for a specific room', () => {
    service.getCalendar(42, '2026-04-01').subscribe();

    const request = http.expectOne(
      req =>
        req.url === `${environment.apiUrl}/partner/calendar` &&
        req.params.get('room_type_id') === '42' &&
        req.params.get('start_date') === '2026-04-01'
    );
    expect(request.request.method).toBe('GET');
    request.flush({ room_id: 42, hotel_id: 1, days: [] });
  });

  it('updates inventory, blocks inventory, and manages pricing overrides', () => {
    service.updateInventory({
      room_type_id: 42,
      start_date: '2026-04-10',
      end_date: '2026-04-12',
      available_units: 7,
      blocked_units: 3,
      status: 'available',
    }).subscribe();
    const inventoryRequest = http.expectOne(`${environment.apiUrl}/partner/calendar`);
    expect(inventoryRequest.request.method).toBe('PUT');
    inventoryRequest.flush({ room_id: 42, hotel_id: 1, days: [] });

    service.blockInventory({
      room_type_id: 42,
      start_date: '2026-04-10',
      end_date: '2026-04-12',
      blocked_units: 2,
      status: 'blocked',
    }).subscribe();
    const blockRequest = http.expectOne(`${environment.apiUrl}/partner/inventory/block`);
    expect(blockRequest.request.method).toBe('POST');
    blockRequest.flush({ room_id: 42, hotel_id: 1, days: [] });

    service.unblockInventory({
      room_type_id: 42,
      start_date: '2026-04-10',
      end_date: '2026-04-12',
      blocked_units: 1,
      status: 'available',
    }).subscribe();
    const unblockRequest = http.expectOne(`${environment.apiUrl}/partner/inventory/unblock`);
    expect(unblockRequest.request.method).toBe('POST');
    unblockRequest.flush({ room_id: 42, hotel_id: 1, days: [] });

    service.updatePricing({
      room_type_id: 42,
      start_date: '2026-04-10',
      end_date: '2026-04-12',
      price: 6200,
      label: 'festival',
    }).subscribe();
    const pricingRequest = http.expectOne(`${environment.apiUrl}/partner/pricing`);
    expect(pricingRequest.request.method).toBe('POST');
    pricingRequest.flush({ room_type_id: 42, hotel_id: 1, days: [] });

    service.getPricingCalendar(42, '2026-04-10').subscribe();
    const pricingCalendarRequest = http.expectOne(
      req =>
        req.url === `${environment.apiUrl}/partner/pricing/calendar` &&
        req.params.get('room_type_id') === '42' &&
        req.params.get('start_date') === '2026-04-10'
    );
    expect(pricingCalendarRequest.request.method).toBe('GET');
    pricingCalendarRequest.flush({ room_type_id: 42, hotel_id: 1, days: [] });
  });
});
