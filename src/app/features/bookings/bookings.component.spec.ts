import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BookingsComponent } from './bookings.component';
import { PartnerService } from '../../core/services/partner.service';

describe('BookingsComponent', () => {
  let fixture: ComponentFixture<BookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: {
            getBookings: () => of({
              bookings: [
                {
                  id: 9,
                  booking_ref: 'BK123456',
                  user_name: 'Alex Guest',
                  email: 'alex@example.com',
                  check_in: '2026-05-02T00:00:00Z',
                  check_out: '2026-05-04T00:00:00Z',
                  guests: 2,
                  total_amount: 9800,
                  status: 'confirmed',
                  payment_status: 'paid',
                },
              ],
              total: 1,
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingsComponent);
    fixture.detectChanges();
  });

  it('renders booking rows from the partner API', () => {
    const native = fixture.nativeElement as HTMLElement;

    expect(native.textContent).toContain('BK123456');
    expect(native.textContent).toContain('Alex Guest');
    expect(native.textContent).toContain('confirmed / paid');
    expect(native.textContent).toContain('INR 9800');
  });
});
