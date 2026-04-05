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
        hotel_name: 'Stayvora Marina Suites',
        room_type: 'suite',
        room_type_name: 'Suite',
        description: 'Sea-facing room',
        price: 4800,
        original_price: 5600,
        total_room_count: 10,
        weekend_price: 5200,
        holiday_price: 6100,
        extra_guest_charge: 750,
        availability: true,
        is_active: true,
        image_url: '',
        gallery_urls: [],
        amenities: ['Breakfast', 'WiFi'],
        location: 'Chennai',
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
  const createRoom = jest.fn(() => of({}));
  const updateRoom = jest.fn(() => of({}));
  const deleteRoom = jest.fn(() => of(void 0));

  beforeEach(async () => {
    getRooms.mockClear();
    createRoom.mockClear();
    updateRoom.mockClear();
    deleteRoom.mockClear();

    await TestBed.configureTestingModule({
      imports: [RoomsComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: { getRooms, createRoom, updateRoom, deleteRoom },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomsComponent);
    fixture.detectChanges();
  });

  it('loads and renders partner room types', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Suite');
    expect(text).toContain('Total rooms');
    expect(getRooms).toHaveBeenCalled();
  });

  it('creates a new room type and refreshes the list', () => {
    const component = fixture.componentInstance;
    getRooms.mockClear();

    component.saveRoomType();

    expect(createRoom).toHaveBeenCalled();
    expect(getRooms).toHaveBeenCalled();
  });

  it('edits and updates an existing room type', () => {
    const component = fixture.componentInstance;
    const room = component.rooms()[0];

    component.editRoom(room);
    component.saveRoomType();

    expect(updateRoom).toHaveBeenCalledWith(room.id, expect.objectContaining({ room_type_name: 'Suite' }));
  });

  it('toggles and archives room types', () => {
    const component = fixture.componentInstance;
    const room = component.rooms()[0];

    component.toggleRoom(room);
    component.deleteRoom(room.id);

    expect(updateRoom).toHaveBeenCalledWith(room.id, { is_active: false, availability: false });
    expect(deleteRoom).toHaveBeenCalledWith(room.id);
  });
});
