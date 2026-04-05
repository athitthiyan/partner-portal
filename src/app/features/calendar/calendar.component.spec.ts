import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CalendarComponent } from './calendar.component';
import { PartnerService } from '../../core/services/partner.service';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let partnerService: {
    getRooms: jest.Mock;
    getCalendar: jest.Mock;
    updateInventory: jest.Mock;
    blockInventory: jest.Mock;
    unblockInventory: jest.Mock;
    updatePricing: jest.Mock;
  };

  beforeEach(async () => {
    partnerService = {
      getRooms: jest.fn(() => of({
        rooms: [
          {
            id: 10,
            hotel_name: 'StayEase Marina Suites',
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
        ],
        total: 1,
      })),
      getCalendar: jest.fn(() => of({
        room_id: 10,
        hotel_id: 1,
        days: [
          {
            date: '2026-05-02',
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
        ],
      })),
      updateInventory: jest.fn(() => of({ room_id: 10, hotel_id: 1, days: [] })),
      blockInventory: jest.fn(() => of({ room_id: 10, hotel_id: 1, days: [] })),
      unblockInventory: jest.fn(() => of({ room_id: 10, hotel_id: 1, days: [] })),
      updatePricing: jest.fn(() => of({ room_type_id: 10, hotel_id: 1, days: [] })),
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
    fixture.detectChanges();
  });

  it('renders calendar metrics for the selected room type', () => {
    const native = fixture.nativeElement as HTMLElement;

    expect(native.textContent).toContain('2026-05-02');
    expect(native.textContent).toContain('Available: 7');
    expect(native.textContent).toContain('Blocked: 2');
    expect(native.textContent).toContain('INR 6200');
  });

  it('applies inventory, block, unblock, and pricing actions', () => {
    const component = fixture.componentInstance;
    component.range.available_units = 6;
    component.range.blocked_units = 3;
    component.range.price = 6800;

    component.applyInventoryUpdate();
    component.quickBlock();
    component.quickUnblock();
    component.updatePricing();

    expect(partnerService.updateInventory).toHaveBeenCalled();
    expect(partnerService.blockInventory).toHaveBeenCalled();
    expect(partnerService.unblockInventory).toHaveBeenCalled();
    expect(partnerService.updatePricing).toHaveBeenCalled();
  });

  it('keeps the calendar empty when no rooms are available', async () => {
    partnerService.getCalendar.mockClear();
    partnerService.getRooms.mockReturnValueOnce(of({ rooms: [], total: 0 }));

    const emptyFixture = TestBed.createComponent(CalendarComponent);
    emptyFixture.detectChanges();
    await emptyFixture.whenStable();

    expect(emptyFixture.componentInstance.calendar()).toEqual([]);
    expect(partnerService.getCalendar).not.toHaveBeenCalled();
  });
});
