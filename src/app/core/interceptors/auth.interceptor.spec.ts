import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  it('forwards requests unchanged when no token exists', () => {
    const next = jest.fn(req => of(new HttpResponse({ status: 200, body: req })));

    TestBed.configureTestingModule({
      providers: [
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

    expect(next).toHaveBeenCalledWith(request);
    expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
  });

  it('adds the bearer token header when a token exists', () => {
    const next = jest.fn(req => of(new HttpResponse({ status: 200, body: req })));

    TestBed.configureTestingModule({
      providers: [
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
});
