import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('Partner AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: { navigate: jest.fn() } }],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stores partner credentials after login', () => {
    service.login('partner@example.com', 'PartnerPass123').subscribe(response => {
      expect(response.user.is_partner).toBe(true);
    });

    const request = http.expectOne(`${environment.apiUrl}/partner/login`);
    request.flush({
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'partner@example.com',
        full_name: 'Partner Owner',
        is_admin: false,
        is_partner: true,
        is_active: true,
      },
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isPartner()).toBe(true);
  });
});
