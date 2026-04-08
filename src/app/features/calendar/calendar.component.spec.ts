import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CalendarComponent } from './calendar.component';
import { PartnerService } from '../../core/services/partner.service';
import { PartnerCalendarDay, PartnerRoom } from '../../core/models/partner.model';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let component: CalendarComponent;
  let partnerService: {
    getRooms: jest.Mock;
    getCalendar: jest.Mock;
    updateInventory: jest.Mock;
    blockInventory: jest.Mock;
    unblockInventory: jest.Mock;
    updatePricing: jest.Mock;
  };

  const mockRooms: PartnerRoom[] = [
    {
      id: 10,
      hotel_name: 'Stayvora Marina Suites',
      room_type: 'suite',
      room_type_name: 'Suite',
      description: 'Sea-facing room',
      price: 4800,
      original_price: 5600,
      total_room_count: 10,
      weekend_price: 5200,
      holiday_price: 6200,
      extra_guest_charge: 500,
      availability: true,
      is_active: true,
      image_url: '',
      gallery_urls: [],
      amenities: [],
      max_guests: 2,
      beds: 1,
      bathrooms: 1,
      created_at: '2026-04-05T00:00:00Z',
    },
    {
      id: 11,
      hotel_name: 'Stayvora Marina Suites',
      room_type: 'deluxe',
      room_type_name: 'Deluxe',
      description: 'Luxury room',
      price: 6500,
      original_price: 7500,
      total_room_count: 8,
      weekend_price: 7200,
      holiday_price: 8500,
      extra_guest_charge: 700,
      availability: true,
      is_active: true,
      image_url: '',
      gallery_urls: [],
      amenities: [],
      max_guests: 4,
      beds: 2,
      bathrooms: 2,
      created_at: '2026-04-05T00:00:00Z',
    },
  ];

  const mockCalendarDays: PartnerCalendarDay[] = [
    {
      date: '2026-04-08',
      total_units: 10,
      available_units: 7,
      locked_units: 1,
      booked_units: 1,
      blocked_units: 2,
      effective_price: 6200,
      block_reason: 'maintenance',
      price_override: 6200,
      price_override_label: 'festival',
      status: 'available',
    },
    {
      date: '2026-04-09',
      total_units: 10,
      available_units: 10,
      locked_units: 0,
      booked_units: 0,
      blocked_units: 0,
      effective_price: 5200,
      block_reason: '',
      price_override: null,
      price_override_label: '',
      status: 'available',
    },
    {
      date: '2026-04-10',
      total_units: 10,
      available_units: 0,
      locked_units: 0,
      booked_units: 10,
      blocked_units: 0,
      effective_price: 4800,
      block_reason: '',
      price_override: null,
      price_override_label: '',
      status: 'booked',
    },
  ];

  beforeEach(async () => {
    partnerService = {
      getRooms: jest.fn(() =>
        of({
          rooms: mockRooms,
          total: mockRooms.length,
        })
      ),
      getCalendar: jest.fn(() =>
        of({
          room_id: 10,
          hotel_id: 1,
          days: mockCalendarDays,
        })
      ),
      updateInventory: jest.fn(() =>
        of({
          room_id: 10,
          hotel_id: 1,
          days: mockCalendarDays,
        })
      ),
      blockInventory: jest.fn(() =>
        of({
          room_id: 10,
          hotel_id: 1,
          days: mockCalendarDays,
        })
      ),
      unblockInventory: jest.fn(() =>
        of({
          room_id: 10,
          hotel_id: 1,
          days: mockCalendarDays,
        })
      ),
      updatePricing: jest.fn(() =>
        of({
          room_type_id: 10,
          hotel_id: 1,
          days: mockCalendarDays,
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: partnerService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test 1: Loads rooms via PartnerService.getRooms() in constructor
  it('should load rooms from PartnerService in constructor and set first room as selected', () => {
    expect(partnerService.getRooms).toHaveBeenCalled();
    expect(component.rooms()).toEqual(mockRooms);
    expect(component.selectedRoomId()).toBe(10);
  });

  // Test 2: Loads calendar via PartnerService.getCalendar()
  it('should load calendar for selected room on initialization', () => {
    expect(partnerService.getCalendar).toHaveBeenCalledWith(10, expect.any(String));
    expect(component.calendar()).toEqual(mockCalendarDays);
  });

  // Test 3: onRoomChange() changes selection and reloads calendar
  it('should change room selection and reload calendar when onRoomChange is called', () => {
    partnerService.getCalendar.mockClear();

    component.onRoomChange('11');

    expect(component.selectedRoomId()).toBe(11);
    expect(partnerService.getCalendar).toHaveBeenCalledWith(11, expect.any(String));
  });

  // Test 4: onRoomChange() parses string to number
  it('should parse string room ID to number in onRoomChange', () => {
    component.onRoomChange('25');

    expect(component.selectedRoomId()).toBe(25);
    expect(typeof component.selectedRoomId()).toBe('number');
  });

  // Test 5: applyInventoryUpdate() calls partnerService.updateInventory()
  it('should call updateInventory with correct parameters', () => {
    component.range.start_date = '2026-04-08';
    component.range.end_date = '2026-04-10';
    component.range.available_units = 6;
    component.range.blocked_units = 3;
    component.range.block_reason = 'maintenance';

    component.applyInventoryUpdate();

    expect(partnerService.updateInventory).toHaveBeenCalledWith({
      room_type_id: 10,
      start_date: '2026-04-08',
      end_date: '2026-04-10',
      available_units: 6,
      blocked_units: 3,
      block_reason: 'maintenance',
      status: 'available',
    });
  });

  // Test 6: applyInventoryUpdate() updates calendar after service call
  it('should update calendar signal after applyInventoryUpdate', () => {
    const newDays: PartnerCalendarDay[] = [
      { ...mockCalendarDays[0], available_units: 5 },
    ];
    partnerService.updateInventory.mockReturnValueOnce(
      of({ room_id: 10, hotel_id: 1, days: newDays })
    );

    component.applyInventoryUpdate();

    expect(component.calendar()).toEqual(newDays);
  });

  // Test 7: applyInventoryUpdate() doesn't call service when no room selected
  it('should not call updateInventory when no room is selected', () => {
    component.selectedRoomId.set(null);
    component.applyInventoryUpdate();

    expect(partnerService.updateInventory).not.toHaveBeenCalled();
  });

  // Test 8: quickBlock() calls partnerService.blockInventory()
  it('should call blockInventory with correct parameters', () => {
    component.range.start_date = '2026-04-08';
    component.range.end_date = '2026-04-10';
    component.range.blocked_units = 4;
    component.range.block_reason = 'maintenance';

    component.quickBlock();

    expect(partnerService.blockInventory).toHaveBeenCalledWith({
      room_type_id: 10,
      start_date: '2026-04-08',
      end_date: '2026-04-10',
      blocked_units: 4,
      block_reason: 'maintenance',
      status: 'blocked',
    });
  });

  // Test 9: quickBlock() sends undefined blocked_units when zero
  it('should send undefined blocked_units when value is zero in quickBlock', () => {
    component.range.blocked_units = 0;

    component.quickBlock();

    expect(partnerService.blockInventory).toHaveBeenCalledWith(
      expect.objectContaining({ blocked_units: undefined })
    );
  });

  // Test 10: quickUnblock() calls partnerService.unblockInventory()
  it('should call unblockInventory with correct parameters', () => {
    component.range.start_date = '2026-04-08';
    component.range.end_date = '2026-04-10';

    component.quickUnblock();

    expect(partnerService.unblockInventory).toHaveBeenCalledWith({
      room_type_id: 10,
      start_date: '2026-04-08',
      end_date: '2026-04-10',
      blocked_units: undefined,
      status: 'available',
    });
  });

  // Test 11: quickUnblock() updates calendar after service call
  it('should update calendar signal after quickUnblock', () => {
    const newDays: PartnerCalendarDay[] = [
      { ...mockCalendarDays[1], available_units: 8 },
    ];
    partnerService.unblockInventory.mockReturnValueOnce(
      of({ room_id: 10, hotel_id: 1, days: newDays })
    );

    component.quickUnblock();

    expect(component.calendar()).toEqual(newDays);
  });

  // Test 12: updatePricing() calls partnerService.updatePricing()
  it('should call updatePricing with correct parameters', () => {
    component.range.start_date = '2026-04-08';
    component.range.end_date = '2026-04-10';
    component.range.price = 7500;
    component.range.block_reason = 'festival';

    component.updatePricing();

    expect(partnerService.updatePricing).toHaveBeenCalledWith({
      room_type_id: 10,
      start_date: '2026-04-08',
      end_date: '2026-04-10',
      price: 7500,
      label: 'festival',
    });
  });

  // Test 13: updatePricing() uses 'override' label when block_reason is empty
  it('should use override label when block_reason is empty in updatePricing', () => {
    component.range.block_reason = '';
    component.range.price = 5000;

    component.updatePricing();

    expect(partnerService.updatePricing).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'override' })
    );
  });

  // Test 14: updatePricing() reloads calendar after service call
  it('should reload calendar after updatePricing', () => {
    component.range.price = 6500;
    partnerService.getCalendar.mockClear();

    component.updatePricing();

    expect(partnerService.getCalendar).toHaveBeenCalledWith(
      10,
      expect.any(String)
    );
  });

  // Test 15: updatePricing() doesn't call service when no room selected
  it('should not call updatePricing when no room is selected', () => {
    component.selectedRoomId.set(null);
    component.range.price = 5000;

    component.updatePricing();

    expect(partnerService.updatePricing).not.toHaveBeenCalled();
  });

  // Test 16: updatePricing() doesn't call service when price is zero
  it('should not call updatePricing when price is zero', () => {
    component.range.price = 0;

    component.updatePricing();

    expect(partnerService.updatePricing).not.toHaveBeenCalled();
  });

  // Test 17: selectDay() populates range form from a day card
  it('should populate range form when selectDay is called', () => {
    const day = mockCalendarDays[0];

    component.selectDay(day);

    expect(component.range.start_date).toBe('2026-04-08');
    expect(component.range.end_date).toBe('2026-04-08');
    expect(component.range.available_units).toBe(7);
    expect(component.range.blocked_units).toBe(2);
    expect(component.range.block_reason).toBe('maintenance');
    expect(component.range.price).toBe(6200);
  });

  // Test 18: selectDay() handles empty block_reason
  it('should handle empty block_reason in selectDay', () => {
    const day = mockCalendarDays[1];

    component.selectDay(day);

    expect(component.range.block_reason).toBe('');
  });

  // Test 19: formatDayLabel() returns correctly formatted day labels
  it('should format day label with day abbreviation, month abbreviation, and date', () => {
    // 2026-04-08 is a Wednesday
    const label = component.formatDayLabel('2026-04-08');

    expect(label).toBe('Wed, Apr 8');
  });

  // Test 20: formatDayLabel() formats different dates correctly
  it('should format different dates correctly', () => {
    // 2026-04-09 is a Thursday
    expect(component.formatDayLabel('2026-04-09')).toBe('Thu, Apr 9');

    // 2026-05-02 is a Saturday
    expect(component.formatDayLabel('2026-05-02')).toBe('Sat, May 2');

    // 2026-12-31 is a Thursday
    expect(component.formatDayLabel('2026-12-31')).toBe('Thu, Dec 31');
  });

  // Test 21: formatDayLabel() handles first day of month
  it('should format first day of month correctly', () => {
    // 2026-01-01 is a Thursday
    expect(component.formatDayLabel('2026-01-01')).toBe('Thu, Jan 1');
  });

  // Test 22: barPercent() returns correct percentage for bar visualization
  it('should calculate correct percentage for bar visualization', () => {
    expect(component.barPercent(5, 10)).toBe(50);
    expect(component.barPercent(7, 10)).toBe(70);
    expect(component.barPercent(1, 10)).toBe(10);
  });

  // Test 23: barPercent() returns 0 when total is zero
  it('should return 0 when total is zero', () => {
    expect(component.barPercent(5, 0)).toBe(0);
  });

  // Test 24: barPercent() returns 0 when total is negative
  it('should return 0 when total is negative', () => {
    expect(component.barPercent(5, -10)).toBe(0);
  });

  // Test 25: barPercent() caps percentage at 100
  it('should cap percentage at 100 when value exceeds total', () => {
    expect(component.barPercent(15, 10)).toBe(100);
  });

  // Test 26: barPercent() rounds percentage correctly
  it('should round percentage values correctly', () => {
    // 1/3 = 0.3333... which rounds to 33
    expect(component.barPercent(1, 3)).toBe(33);

    // 2/3 = 0.6666... which rounds to 67
    expect(component.barPercent(2, 3)).toBe(67);
  });

  // Test 27: Handles empty rooms array
  it('should keep calendar empty when no rooms are available', async () => {
    partnerService.getRooms.mockReturnValueOnce(
      of({ rooms: [], total: 0 })
    );
    partnerService.getCalendar.mockClear();

    const emptyFixture = TestBed.createComponent(CalendarComponent);
    emptyFixture.detectChanges();
    await emptyFixture.whenStable();

    expect(emptyFixture.componentInstance.calendar()).toEqual([]);
    expect(partnerService.getCalendar).not.toHaveBeenCalled();
  });

  // Test 28: quickBlock() doesn't call service when no room selected
  it('should not call blockInventory when no room is selected', () => {
    component.selectedRoomId.set(null);

    component.quickBlock();

    expect(partnerService.blockInventory).not.toHaveBeenCalled();
  });

  // Test 29: quickUnblock() doesn't call service when no room selected
  it('should not call unblockInventory when no room is selected', () => {
    component.selectedRoomId.set(null);

    component.quickUnblock();

    expect(partnerService.unblockInventory).not.toHaveBeenCalled();
  });

  // Test 30: Calendar renders day cards with correct data
  it('should render calendar day cards in the template', () => {
    const native = fixture.nativeElement as HTMLElement;
    const dayCards = native.querySelectorAll('.calendar__day');

    expect(dayCards.length).toBeGreaterThan(0);
    expect(native.textContent).toContain('Wed, Apr 8');
  });

  // Test 31: Room selector displays all available rooms
  it('should display all rooms in the room selector', () => {
    const native = fixture.nativeElement as HTMLElement;
    const options = native.querySelectorAll('select option');

    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('Suite');
    expect(options[1].textContent).toContain('Deluxe');
  });

  // Test 32: barPercent() with decimal values
  it('should handle decimal value calculations', () => {
    expect(component.barPercent(3.5, 10)).toBe(35);
    expect(component.barPercent(2.5, 10)).toBe(25);
  });

  // Test 33: Multiple rapid room changes work correctly
  it('should handle multiple rapid room changes', () => {
    partnerService.getCalendar.mockClear();

    component.onRoomChange('11');
    expect(component.selectedRoomId()).toBe(11);

    component.onRoomChange('10');
    expect(component.selectedRoomId()).toBe(10);

    component.onRoomChange('25');
    expect(component.selectedRoomId()).toBe(25);

    expect(partnerService.getCalendar).toHaveBeenCalledTimes(3);
  });

  // Test 34: selectDay() preserves day data through multiple selections
  it('should correctly update form when selecting different days', () => {
    component.selectDay(mockCalendarDays[0]);
    expect(component.range.available_units).toBe(7);

    component.selectDay(mockCalendarDays[1]);
    expect(component.range.available_units).toBe(10);
    expect(component.range.blocked_units).toBe(0);

    component.selectDay(mockCalendarDays[2]);
    expect(component.range.available_units).toBe(0);
    expect(component.range.blocked_units).toBe(0);
  });

  // Test 35: applyInventoryUpdate() with zero values
  it('should handle zero values in applyInventoryUpdate', () => {
    component.range.available_units = 0;
    component.range.blocked_units = 0;

    component.applyInventoryUpdate();

    expect(partnerService.updateInventory).toHaveBeenCalledWith(
      expect.objectContaining({
        available_units: 0,
        blocked_units: 0,
      })
    );
  });
});
