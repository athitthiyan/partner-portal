import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    user: signal(null),
  };

  beforeEach(async () => {
    authService.login.mockReset();
    authService.logout.mockReset();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a validation error when credentials are missing', () => {
    fixture.componentInstance.login();

    expect(fixture.componentInstance.error()).toBe('Email and password are required.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('navigates to the dashboard for partner users', () => {
    authService.login.mockReturnValue(
      of({
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
      })
    );
    fixture.componentInstance.email = 'partner@example.com';
    fixture.componentInstance.password = 'PartnerPass123';

    fixture.componentInstance.login();

    expect(authService.login).toHaveBeenCalledWith('partner@example.com', 'PartnerPass123');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('logs the user out and shows an access error for non-partner accounts', () => {
    authService.login.mockReturnValue(
      of({
        access_token: 'access',
        refresh_token: 'refresh',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'user@example.com',
          full_name: 'Regular User',
          is_admin: false,
          is_partner: false,
          is_active: true,
        },
      })
    );
    fixture.componentInstance.email = 'user@example.com';
    fixture.componentInstance.password = 'UserPass123';

    fixture.componentInstance.login();

    expect(authService.logout).toHaveBeenCalledWith(false);
    expect(fixture.componentInstance.error()).toBe('This account does not have partner access.');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('shows backend error details when login fails', () => {
    authService.login.mockReturnValue(
      throwError(() => ({
        error: { detail: 'Invalid partner credentials' },
      }))
    );
    fixture.componentInstance.email = 'partner@example.com';
    fixture.componentInstance.password = 'wrong';

    fixture.componentInstance.login();

    expect(fixture.componentInstance.error()).toBe('Invalid partner credentials');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('falls back to a generic error message when login fails without detail', () => {
    authService.login.mockReturnValue(throwError(() => ({})));
    fixture.componentInstance.email = 'partner@example.com';
    fixture.componentInstance.password = 'wrong';

    fixture.componentInstance.login();

    expect(fixture.componentInstance.error()).toBe('Unable to sign in right now.');
  });
});
