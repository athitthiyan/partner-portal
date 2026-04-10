import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('Partner AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: { navigate: jest.Mock };

  const configureTestingModule = () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: router }],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: jest.fn() };
    configureTestingModule();
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
    expect(localStorage.getItem('partner_portal_auth_user')).toContain('partner@example.com');
  });

  it('stores partner credentials after registration', () => {
    service.register({
      email: 'partner@example.com',
      full_name: 'Partner Owner',
      password: 'PartnerPass123',
      legal_name: 'Stayvora Hospitality',
      display_name: 'Stayvora Marina Suites',
      support_email: 'partner@example.com',
      support_phone: '+91 98765 43210',
      address_line: '12 Marina Beach Road',
      city: 'Chennai',
      country: 'India',
    }).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/register`);
    expect(request.request.method).toBe('POST');
    request.flush({
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'bearer',
      user: {
        id: 2,
        email: 'partner@example.com',
        full_name: 'Partner Owner',
        is_admin: false,
        is_partner: true,
        is_active: true,
      },
    });

    expect(localStorage.getItem('partner_portal_auth_user')).toContain('partner@example.com');
  });

  it('returns null from restoreSession when no token exists', () => {
    service.restoreSession().subscribe(restored => {
      expect(restored).toBe(false);
    });
  });

  it('exposes the current access token through the computed getter', () => {
    expect(service.accessToken()).toBeNull();

    service.login('partner@example.com', 'PartnerPass123').subscribe();

    const request = http.expectOne(`${environment.apiUrl}/partner/login`);
    request.flush({
      access_token: 'computed-access',
      refresh_token: 'computed-refresh',
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

    expect(service.accessToken()).toBe('computed-access');
  });

  it('refreshes tokens through the auth refresh endpoint', () => {
    localStorage.setItem('partner_portal_auth_user', JSON.stringify({
      id: 1,
      email: 'partner@example.com',
      full_name: 'Partner Owner',
      is_admin: false,
      is_partner: true,
      is_active: true,
    }));
    TestBed.resetTestingModule();
    configureTestingModule();

    service.refreshToken$().subscribe(response => {
      expect(response.access_token).toBe('new-access');
    });

    const request = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
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

    expect(service.accessToken()).toBe('new-access');
  });

  it('restores the active partner session from auth/me', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      'partner_portal_auth_user',
      JSON.stringify({
        id: 3,
        email: 'partner@example.com',
        full_name: 'Stored Partner',
        is_admin: false,
        is_partner: true,
        is_active: true,
      })
    );
    configureTestingModule();

    service.restoreSession()?.subscribe(restored => {
      expect(restored).toBe(true);
    });

    const request = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(request.request.method).toBe('POST');
    request.flush({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      token_type: 'bearer',
      user: {
        id: 3,
        email: 'partner@example.com',
        full_name: 'Partner Owner',
        is_admin: false,
        is_partner: true,
        is_active: true,
      },
    });

    expect(service.user()?.full_name).toBe('Partner Owner');
  });

  it('logs out without redirect when restoreSession returns a non-partner user', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      'partner_portal_auth_user',
      JSON.stringify({
        id: 4,
        email: 'user@example.com',
        full_name: 'Regular User',
        is_admin: false,
        is_partner: false,
        is_active: true,
      })
    );
    configureTestingModule();

    service.restoreSession()?.subscribe();

    const request = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    request.flush({
      access_token: 'saved-access',
      refresh_token: 'saved-refresh',
      token_type: 'bearer',
      user: {
        id: 4,
        email: 'user@example.com',
        full_name: 'Regular User',
        is_admin: false,
        is_partner: false,
        is_active: true,
      },
    });

    // Flush the fire-and-forget logout POST triggered by non-partner detection
    const logoutReq = http.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush({ message: 'Logged out successfully' });

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('partner_portal_auth_user')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('clears local storage and redirects on logout by default', () => {
    localStorage.setItem('partner_portal_auth_user', '{"id":1}');

    service.logout();

    http.expectOne(`${environment.apiUrl}/auth/logout`).flush({ message: 'Logged out successfully' });

    expect(localStorage.getItem('partner_portal_auth_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('removes malformed stored users during initialization', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('partner_portal_auth_user', '{invalid-json');

    configureTestingModule();

    expect(service.user()).toBeNull();
    expect(localStorage.getItem('partner_portal_auth_user')).toBeNull();
    http.verify();
  });

  it('returns access token via getAccessToken after login', () => {
    expect(service.getAccessToken()).toBeNull();

    service.login('partner@example.com', 'PartnerPass123').subscribe();
    http.expectOne(`${environment.apiUrl}/partner/login`).flush({
      access_token: 'get-access',
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

    expect(service.getAccessToken()).toBe('get-access');
  });

  it('clears auth state when restoreSession refresh fails', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('partner_portal_auth_user', JSON.stringify({
      id: 1,
      email: 'partner@example.com',
      full_name: 'Partner Owner',
      is_admin: false,
      is_partner: true,
      is_active: true,
    }));
    configureTestingModule();

    let restoredResult: boolean | undefined;
    service.restoreSession().subscribe(restored => {
      restoredResult = restored;
    });

    http.expectOne(`${environment.apiUrl}/auth/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(restoredResult).toBe(false);
    expect(service.accessToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('partner_portal_auth_user')).toBeNull();
  });

  it('clears storage without redirect when logout is called with redirect disabled', () => {
    localStorage.setItem('partner_portal_auth_user', '{"id":1}');

    service.logout(false);

    http.expectOne(`${environment.apiUrl}/auth/logout`).flush({ message: 'Logged out successfully' });

    expect(localStorage.getItem('partner_portal_auth_user')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
