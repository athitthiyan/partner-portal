import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  const router = { navigate: jest.fn() };

  beforeEach(() => {
    router.navigate.mockReset();
  });

  it('forwards requests unchanged when no token exists', () => {
    const next = jest.fn(req => of(new HttpResponse({ status: 200, body: req })));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: AuthService,
          useValue: {
            accessToken: () => null,
          },
        },
      ],
    });

    const request = new HttpRequest('GET', '/partner/hotel');
    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe();
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
    expect(next.mock.calls[0][0].withCredentials).toBe(true);
  });

  it('adds the bearer token header when a token exists', () => {
    const next = jest.fn(req => of(new HttpResponse({ status: 200, body: req })));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: AuthService,
          useValue: {
            accessToken: () => 'partner-token',
          },
        },
      ],
    });

    const request = new HttpRequest('GET', '/partner/hotel');
    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe();
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer partner-token');
  });

  it('refreshes the token and retries the original request after a 401', done => {
    const authService = {
      accessToken: jest
        .fn()
        .mockReturnValueOnce('expired-token')
        .mockReturnValueOnce('expired-token'),
      refreshToken$: jest.fn(() => of({ access_token: 'fresh-token' })),
      logout: jest.fn(),
    };
    const next = jest
      .fn()
      .mockImplementationOnce(() =>
        throwError(() => new HttpErrorResponse({ status: 401, url: '/partner/hotel' })),
      )
      .mockImplementationOnce(req => {
        expect(req.headers.get('Authorization')).toBe('Bearer fresh-token');
        return of(new HttpResponse({ status: 200, body: 'ok' }));
      });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
      ],
    });

    const request = new HttpRequest('GET', '/partner/hotel');
    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe({
        complete: () => {
          expect(authService.refreshToken$).toHaveBeenCalled();
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('logs out and redirects when token refresh fails after a 401', done => {
    const authService = {
      accessToken: jest.fn(() => 'expired-token'),
      refreshToken$: jest.fn(() => throwError(() => new Error('refresh failed'))),
      logout: jest.fn(),
    };
    const next = jest.fn(() =>
      throwError(() => new HttpErrorResponse({ status: 401, url: '/partner/hotel' })),
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
      ],
    });

    const request = new HttpRequest('GET', '/partner/hotel');
    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe({
        error: () => {
          expect(authService.logout).toHaveBeenCalledWith(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
      });
    });
  });

  it('logs out immediately on 401 responses when no access token is available to refresh', done => {
    const authService = {
      accessToken: jest.fn(() => null),
      refreshToken$: jest.fn(() => throwError(() => new Error('missing access token'))),
      logout: jest.fn(),
    };
    const next = jest.fn(() =>
      throwError(() => new HttpErrorResponse({ status: 401, url: '/partner/hotel' })),
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
      ],
    });

    const request = new HttpRequest('GET', '/partner/hotel');
    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe({
        error: () => {
          expect(authService.refreshToken$).toHaveBeenCalled();
          expect(authService.logout).toHaveBeenCalledWith(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
      });
    });
  });

  it('does not force logout for login and refresh endpoints', done => {
    const authService = {
      accessToken: jest.fn(() => 'token'),
      refreshToken$: jest.fn(),
      logout: jest.fn(),
    };
    const next = jest.fn(() =>
      throwError(() => new HttpErrorResponse({ status: 401, url: '/partner/login' })),
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
      ],
    });

    const request = new HttpRequest('POST', '/partner/login', null);
    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe({
        error: () => {
          expect(authService.logout).not.toHaveBeenCalled();
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
