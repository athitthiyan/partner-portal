import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { PartnerService } from '../../core/services/partner.service';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  const updateHotel = jest.fn(() => of({}));

  beforeEach(async () => {
    updateHotel.mockClear();

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: {
            getHotel: () => of({
              id: 1,
              owner_user_id: 2,
              legal_name: 'StayEase Hospitality Pvt Ltd',
              display_name: 'StayEase Marina Suites',
              support_email: 'partner@example.com',
              support_phone: '+91 98765 43210',
              address_line: '12 Marina Beach Road',
              city: 'Chennai',
              country: 'India',
              check_in_time: '14:00',
              check_out_time: '11:00',
              cancellation_window_hours: 24,
              instant_confirmation_enabled: true,
              free_cancellation_enabled: true,
              verified_badge: true,
              payout_cycle: 'weekly',
              payout_currency: 'INR',
              bank_account_name: 'StayEase Marina Suites',
              bank_ifsc: 'HDFC0001234',
              bank_upi_id: 'hotel@upi',
              created_at: '2026-04-05T00:00:00Z',
            }),
            updateHotel,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
  });

  it('hydrates the settings form from the hotel profile', () => {
    const component = fixture.componentInstance;

    expect(component.draft.display_name).toBe('StayEase Marina Suites');
    expect(component.draft.support_email).toBe('partner@example.com');
    expect(component.draft.bank_ifsc).toBe('HDFC0001234');
  });

  it('submits updated hotel settings', () => {
    fixture.componentInstance.save();

    expect(updateHotel).toHaveBeenCalledWith(fixture.componentInstance.draft);
  });
});
