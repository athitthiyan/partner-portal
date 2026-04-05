import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CalendarComponent } from './calendar.component';
import { PartnerService } from '../../core/services/partner.service';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let partnerService: {
    getRooms: jest.Mock;
    getCalendar: jest.Mock;
  };

  beforeEach(async () => {
    partnerService = {
      getRooms: jest.fn(() => of({
        rooms: [
          {
            id: 10,
            hotel_name: 'StayEase Marina Suites',
            room_type: 'suite',
            description: 'Sea-facing room',
            price: 4800,
            availability: true,
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
            total_units: 5,
            available_units: 3,
            locked_units: 2,
            status: 'locked',
          },
        ],
      })),
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

  it('renders calendar day metrics for the first room', () => {
    const native = fixture.nativeElement as HTMLElement;

    expect(native.textContent).toContain('2026-05-02');
    expect(native.textContent).toContain('Total: 5');
    expect(native.textContent).toContain('Available: 3');
    expect(native.textContent).toContain('Locked: 2');
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
