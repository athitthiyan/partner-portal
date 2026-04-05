import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let routerEvents$: Subject<NavigationEnd>;
  let authService: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    user: ReturnType<typeof signal<{ full_name: string } | null>>;
    restoreSession: jest.Mock;
    logout: jest.Mock;
  };
  let router: {
    url: string;
    events: Subject<NavigationEnd>;
    createUrlTree: jest.Mock;
    serializeUrl: jest.Mock;
  };

  beforeEach(async () => {
    routerEvents$ = new Subject<NavigationEnd>();
    router = {
      url: '/',
      events: routerEvents$,
      createUrlTree: jest.fn(() => ({})),
      serializeUrl: jest.fn(() => '/'),
    };
    authService = {
      isAuthenticated: signal(true),
      user: signal({ full_name: 'Partner Owner' }),
      restoreSession: jest.fn(() => null),
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('shows the partner shell for authenticated users away from auth routes', () => {
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.partner-layout')).not.toBeNull();
  });

  it('hides the partner shell on login route', () => {
    router.url = '/login';

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.partner-layout')).toBeNull();
  });

  it('closes the sidebar on navigation end', () => {
    fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.sidebarOpen.set(true);

    fixture.detectChanges();
    router.url = '/rooms';
    routerEvents$.next(new NavigationEnd(1, '/rooms', '/rooms'));
    fixture.detectChanges();

    expect(component.sidebarOpen()).toBe(false);
  });

  it('logs out when restoreSession errors', () => {
    authService.restoreSession.mockReturnValueOnce(
      throwError(() => new Error('restore failed'))
    );

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(authService.logout).toHaveBeenCalledWith(false);
  });
});
