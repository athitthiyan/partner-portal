import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CalendarComponent } from './calendar.component';
import { PartnerService } from '../../core/services/partner.service';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: {
            getRooms: () => of({
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
            }),
            getCalendar: () => of({
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
            }),
          },
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
});
