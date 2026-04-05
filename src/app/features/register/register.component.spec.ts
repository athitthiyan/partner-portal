import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;
  const authService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    authService.register.mockReset();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('navigates to the dashboard after successful registration', () => {
    authService.register.mockReturnValue(of({}));

    fixture.componentInstance.register();

    expect(authService.register).toHaveBeenCalledWith(fixture.componentInstance.form);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('shows backend error details when registration fails', () => {
    authService.register.mockReturnValue(
      throwError(() => ({
        error: { detail: 'Hotel already exists' },
      }))
    );

    fixture.componentInstance.register();

    expect(fixture.componentInstance.error()).toBe('Hotel already exists');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('falls back to a generic message when registration fails without detail', () => {
    authService.register.mockReturnValue(throwError(() => ({})));

    fixture.componentInstance.register();

    expect(fixture.componentInstance.error()).toBe('Unable to create partner account right now.');
  });
});
