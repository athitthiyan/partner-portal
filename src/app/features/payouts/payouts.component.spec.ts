import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PayoutsComponent } from './payouts.component';
import { PartnerService } from '../../core/services/partner.service';

describe('PayoutsComponent', () => {
  let fixture: ComponentFixture<PayoutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayoutsComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: {
            getPayouts: () => of({
              payouts: [
                {
                  id: 1,
                  hotel_id: 2,
                  booking_id: 8,
                  gross_amount: 12000,
                  commission_amount: 1800,
                  net_amount: 10200,
                  currency: 'INR',
                  status: 'processing',
                  payout_reference: 'PO12345',
                  payout_date: '2026-05-01T00:00:00Z',
                  created_at: '2026-04-05T00:00:00Z',
                },
              ],
              total: 1,
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PayoutsComponent);
    fixture.detectChanges();
  });

  it('renders payout settlement details', () => {
    const native = fixture.nativeElement as HTMLElement;

    expect(native.textContent).toContain('PO12345');
    expect(native.textContent).toContain('Status: processing');
    expect(native.textContent).toContain('Gross INR 12000');
    expect(native.textContent).toContain('Net INR 10200');
  });
});
