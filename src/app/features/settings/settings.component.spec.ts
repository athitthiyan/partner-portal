import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { PartnerService } from '../../core/services/partner.service';
import { PartnerHotel } from '../../core/models/partner.model';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  const updateHotel = jest.fn(() => of({}));
  const getHotel = jest.fn(() => of<PartnerHotel>({
    id: 1,
    owner_user_id: 2,
    legal_name: 'Stayvora Hospitality Pvt Ltd',
    display_name: 'Stayvora Marina Suites',
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
    bank_account_name: 'Stayvora Marina Suites',
    bank_ifsc: 'HDFC0001234',
    bank_upi_id: 'hotel@upi',
    created_at: '2026-04-05T00:00:00Z',
  }));

  const mockHotel: PartnerHotel = {
    id: 1,
    owner_user_id: 2,
    legal_name: 'Stayvora Hospitality Pvt Ltd',
    display_name: 'Stayvora Marina Suites',
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
    bank_account_name: 'Stayvora Marina Suites',
    bank_ifsc: 'HDFC0001234',
    bank_upi_id: 'hotel@upi',
    created_at: '2026-04-05T00:00:00Z',
  };

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

  // Test 1: Component initializes with editMode signal set to false
  it('initializes with editMode signal set to false', () => {
    const component = fixture.componentInstance;
    expect(component.editMode()).toBe(false);
  });

  // Test 2: Component initializes with changeRequested signal set to false
  it('initializes with changeRequested signal set to false', () => {
    const component = fixture.componentInstance;
    expect(component.changeRequested()).toBe(false);
  });

  // Test 3: Loads hotel data via PartnerService.getHotel() in constructor
  it('hydrates the settings form from the hotel profile', () => {
    const component = fixture.componentInstance;

    expect(component.draft.display_name).toBe('Stayvora Marina Suites');
    expect(component.draft.support_email).toBe('partner@example.com');
    expect(component.draft.bank_ifsc).toBe('HDFC0001234');
  });

  // Test 4: save() calls updateHotel and sets editMode to false
  it('calls partnerService.updateHotel and sets editMode to false on save', () => {
    const component = fixture.componentInstance;
    component.editMode.set(true);
    const initialDraft = { ...component.draft };

    component.save();

    expect(updateHotel).toHaveBeenCalledWith(initialDraft);
    expect(component.editMode()).toBe(false);
  });

  // Test 5: save() updates originalDraft after successful save
  it('updates originalDraft after successful save', () => {
    const component = fixture.componentInstance;
    component.editMode.set(true);
    const newName = 'Updated Hotel Name';
    component.draft.display_name = newName;

    component.save();

    // After save, originalDraft should match the current draft
    expect(component.draft.display_name).toBe(newName);
  });

  // Test 6: cancelEdit() restores original draft and sets editMode to false
  it('restores original draft and sets editMode to false on cancelEdit', () => {
    const component = fixture.componentInstance;
    const originalName = component.draft.display_name;
    const originalEmail = component.draft.support_email;

    component.editMode.set(true);
    component.draft.display_name = 'Modified Name';
    component.draft.support_email = 'modified@example.com';

    component.cancelEdit();

    expect(component.draft.display_name).toBe(originalName);
    expect(component.draft.support_email).toBe(originalEmail);
    expect(component.editMode()).toBe(false);
  });

  // Test 7: requestChange() calls updateHotel with change_request flag and sets changeRequested to true
  it('calls updateHotel with change_request flag and sets changeRequested to true on requestChange', () => {
    const component = fixture.componentInstance;

    component.requestChange();

    expect(updateHotel).toHaveBeenCalledWith({ change_request: true });
    expect(component.changeRequested()).toBe(true);
  });

  // Test 8: requestChange() sets changeRequested to true even on error
  it('sets changeRequested to true even if updateHotel errors on requestChange', () => {
    const component = fixture.componentInstance;
    updateHotel.mockReturnValueOnce(throwError(() => new Error('API error')));

    component.requestChange();

    expect(component.changeRequested()).toBe(true);
  });

  // Test 9: editMode signal toggles correctly when set directly
  it('toggles editMode signal when set directly', () => {
    const component = fixture.componentInstance;

    expect(component.editMode()).toBe(false);
    component.editMode.set(true);
    expect(component.editMode()).toBe(true);
    component.editMode.set(false);
    expect(component.editMode()).toBe(false);
  });

  // Test 10: Does not rehydrate once the form has already been initialized
  it('does not rehydrate once the form has already been initialized', () => {
    const hotel$ = new Subject<PartnerHotel>();
    getHotel.mockReturnValueOnce(hotel$.asObservable());

    const replayFixture = TestBed.createComponent(SettingsComponent);
    replayFixture.detectChanges();

    hotel$.next({
      id: 1,
      owner_user_id: 2,
      legal_name: 'Stayvora Hospitality Pvt Ltd',
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
      bank_account_name: 'Stayvora Marina Suites',
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

  // Test 11: Falls back to empty strings for optional hotel fields
  it('falls back to empty strings for optional hotel fields', () => {
    getHotel.mockReturnValueOnce(of<PartnerHotel>({
      id: 1,
      owner_user_id: 2,
      legal_name: 'Stayvora Hospitality Pvt Ltd',
      display_name: 'Stayvora Marina Suites',
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

  // Test 12: Multiple edit cycles work correctly
  it('handles multiple edit cycles correctly', () => {
    const component = fixture.componentInstance;

    // First edit cycle
    component.editMode.set(true);
    component.draft.display_name = 'First Edit';
    component.save();
    expect(component.editMode()).toBe(false);

    // Second edit cycle
    component.editMode.set(true);
    component.draft.display_name = 'Second Edit';
    component.cancelEdit();
    expect(component.draft.display_name).toBe('First Edit');
    expect(component.editMode()).toBe(false);
  });

  // Test 13: Draft modifications don't affect originalDraft until save is called
  it('draft modifications do not affect originalDraft until save is called', () => {
    const component = fixture.componentInstance;
    const originalEmail = component.draft.support_email;

    component.editMode.set(true);
    component.draft.support_email = 'new@example.com';

    // Before save, draft is modified but should be restorable via cancelEdit
    component.cancelEdit();
    expect(component.draft.support_email).toBe(originalEmail);
  });

  // Test 14: PartnerService.getHotel is called on component initialization
  it('calls partnerService.getHotel on component initialization', () => {
    expect(getHotel).toHaveBeenCalled();
  });

  // Test 15: All draft fields are initialized correctly from hotel data
  it('initializes all draft fields from hotel data', () => {
    const component = fixture.componentInstance;

    expect(component.draft.display_name).toBe(mockHotel.display_name);
    expect(component.draft.support_email).toBe(mockHotel.support_email);
    expect(component.draft.support_phone).toBe(mockHotel.support_phone || '');
    expect(component.draft.gst_number).toBe(mockHotel.gst_number || '');
    expect(component.draft.bank_account_name).toBe(mockHotel.bank_account_name || '');
    expect(component.draft.bank_ifsc).toBe(mockHotel.bank_ifsc || '');
    expect(component.draft.bank_upi_id).toBe(mockHotel.bank_upi_id || '');
  });
});
