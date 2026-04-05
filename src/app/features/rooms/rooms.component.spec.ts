import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RoomsComponent } from './rooms.component';
import { PartnerService } from '../../core/services/partner.service';

describe('RoomsComponent', () => {
  let fixture: ComponentFixture<RoomsComponent>;
  const getRooms = jest.fn(() => of({
    rooms: [
      {
        id: 1,
        hotel_name: 'StayEase Marina Suites',
        room_type: 'suite',
        description: 'Sea-facing room',
        price: 4800,
        original_price: 5600,
        availability: true,
        image_url: '',
        gallery_urls: [],
        amenities: ['Breakfast', 'WiFi'],
        city: 'Chennai',
        country: 'India',
        max_guests: 2,
        beds: 1,
        bathrooms: 1,
        created_at: '2026-04-05T00:00:00Z',
      },
    ],
    total: 1,
  }));
  const createRoom = jest.fn(() => of({
    id: 2,
    hotel_name: 'StayEase Marina Suites',
    room_type: 'suite',
    description: 'New room',
    price: 3500,
    availability: true,
    image_url: '',
    gallery_urls: [],
    amenities: [],
    max_guests: 2,
    beds: 1,
    bathrooms: 1,
    created_at: '2026-04-05T00:00:00Z',
  }));

  beforeEach(async () => {
    getRooms.mockClear();
    createRoom.mockClear();

    await TestBed.configureTestingModule({
      imports: [RoomsComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: { getRooms, createRoom },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomsComponent);
    fixture.detectChanges();
  });

  it('loads and renders partner rooms', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('StayEase Marina Suites - suite');
    expect(getRooms).toHaveBeenCalled();
  });

  it('creates a room and refreshes the listing', () => {
    const component = fixture.componentInstance;
    getRooms.mockClear();

    component.createRoom();

    expect(createRoom).toHaveBeenCalled();
    expect(getRooms).toHaveBeenCalled();
  });
});
