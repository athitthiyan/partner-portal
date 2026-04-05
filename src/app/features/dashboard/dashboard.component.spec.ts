import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { PartnerService } from '../../core/services/partner.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: PartnerService,
          useValue: {
            getRevenue: () => of({
              total_bookings: 12,
              confirmed_bookings: 10,
              cancelled_bookings: 2,
              gross_revenue: 150000,
              commission_amount: 22500,
              net_revenue: 127500,
              pending_payouts: 30000,
              paid_out: 97500,
              default_commission_rate: 0.15,
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('renders revenue summary cards from the partner API', () => {
    const native = fixture.nativeElement as HTMLElement;

    expect(native.textContent).toContain('INR 150000');
    expect(native.textContent).toContain('INR 127500');
    expect(native.textContent).toContain('10');
    expect(native.textContent).toContain('INR 30000');
  });
});
