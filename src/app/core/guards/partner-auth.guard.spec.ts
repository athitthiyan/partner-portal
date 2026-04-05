import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { partnerAuthGuard } from './partner-auth.guard';
import { AuthService } from '../services/auth.service';

describe('partnerAuthGuard', () => {
  it('allows authenticated partners', () => {
    const router = { createUrlTree: jest.fn() };
    const auth = {
      isAuthenticated: signal(true),
      isPartner: signal(true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    });

    expect(TestBed.runInInjectionContext(() => partnerAuthGuard(null as never, null as never))).toBe(true);
  });

  it('redirects unauthenticated users to login', () => {
    const tree = {} as never;
    const router = { createUrlTree: jest.fn(() => tree) };
    const auth = {
      isAuthenticated: signal(false),
      isPartner: signal(false),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    });

    expect(TestBed.runInInjectionContext(() => partnerAuthGuard(null as never, null as never))).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
