import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { PartnerUser } from '../../../core/models/auth.model';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  const authService = {
    user: signal<PartnerUser | null>({
      id: 1,
      email: 'partner@example.com',
      full_name: 'Partner Owner',
      is_admin: false,
      is_partner: true,
      is_active: true,
    }),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  });

  it('renders the partner user display name and initials', () => {
    const native = fixture.nativeElement as HTMLElement;

    expect(native.textContent).toContain('Partner Owner');
    expect(native.querySelector('.partner-header__avatar')?.textContent?.trim()).toBe('PO');
  });

  it('logs out when logout button is clicked', () => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.partner-header__logout')?.click();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('falls back to the generic partner label when no user is loaded', () => {
    authService.user.set(null);
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('Partner');
    expect(native.querySelector('.partner-header__avatar')?.textContent?.trim()).toBe('P');
  });
});
