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
    const payload = { display_name: 'StayEase Marina Suites', bank_account_number: '12345678' };

    service.updateHotel(payload).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/hotel`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('gets partner rooms', () => {
    service.getRooms().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/rooms`);
    expect(request.request.method).toBe('GET');
    request.flush({ rooms: [], total: 0 });
  });

  it('creates a partner room', () => {
    const payload: Partial<PartnerRoom> = { room_type: 'suite', price: 3500 };

    service.createRoom(payload).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/rooms`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
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
    service.getCalendar(42).subscribe();

    const request = http.expectOne(
      req => req.url === `${environment.apiUrl}/partner/calendar` && req.params.get('room_id') === '42'
    );
    expect(request.request.method).toBe('GET');
    request.flush({ room_id: 42, hotel_id: 1, days: [] });
  });
});
