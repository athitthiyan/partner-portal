import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { PartnerService } from '../../core/services/partner.service';
import { PartnerHotel } from '../../core/models/partner.model';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  const updateHotel = jest.fn(() => of({}));
  const getHotel = jest.fn(() => of<PartnerHotel>({
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
  }));

  beforeEach(async () => {
    updateHotel.mockClear();
    getHotel.mockClear();

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: {
            getHotel,
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

  it('does not rehydrate once the form has already been initialized', () => {
    const hotel$ = new Subject<PartnerHotel>();
    getHotel.mockReturnValueOnce(hotel$.asObservable());

    const replayFixture = TestBed.createComponent(SettingsComponent);
    replayFixture.detectChanges();

    hotel$.next({
      id: 1,
      owner_user_id: 2,
      legal_name: 'StayEase Hospitality Pvt Ltd',
      display_name: 'Initial Name',
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
    });

    replayFixture.componentInstance.draft.display_name = 'Edited hotel name';

    hotel$.next({
      id: 1,
      owner_user_id: 2,
      legal_name: 'Changed Legal Name',
      display_name: 'Fresh API Value',
      support_email: 'other@example.com',
      support_phone: '',
      address_line: 'Changed',
      city: 'Delhi',
      country: 'India',
      check_in_time: '14:00',
      check_out_time: '11:00',
      cancellation_window_hours: 24,
      instant_confirmation_enabled: true,
      free_cancellation_enabled: true,
      verified_badge: false,
      payout_cycle: 'weekly',
      payout_currency: 'INR',
      bank_account_name: '',
      bank_ifsc: '',
      bank_upi_id: '',
      created_at: '2026-04-05T00:00:00Z',
    });

    expect(replayFixture.componentInstance.draft.display_name).toBe('Edited hotel name');
  });

  it('falls back to empty strings for optional hotel fields', () => {
    getHotel.mockReturnValueOnce(of<PartnerHotel>({
      id: 1,
      owner_user_id: 2,
      legal_name: 'StayEase Hospitality Pvt Ltd',
      display_name: 'StayEase Marina Suites',
      support_email: 'partner@example.com',
      support_phone: null,
      address_line: '12 Marina Beach Road',
      city: 'Chennai',
      country: 'India',
      gst_number: null,
      description: null,
      check_in_time: '14:00',
      check_out_time: '11:00',
      cancellation_window_hours: 24,
      instant_confirmation_enabled: true,
      free_cancellation_enabled: true,
      verified_badge: true,
      payout_cycle: 'weekly',
      payout_currency: 'INR',
      bank_account_name: null,
      bank_ifsc: null,
      bank_upi_id: null,
      created_at: '2026-04-05T00:00:00Z',
    }));

    const fallbackFixture = TestBed.createComponent(SettingsComponent);
    fallbackFixture.detectChanges();

    expect(fallbackFixture.componentInstance.draft.support_phone).toBe('');
    expect(fallbackFixture.componentInstance.draft.gst_number).toBe('');
    expect(fallbackFixture.componentInstance.draft.bank_account_name).toBe('');
    expect(fallbackFixture.componentInstance.draft.description).toBe('');
  });
});
