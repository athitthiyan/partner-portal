import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PayoutsComponent } from './payouts.component';
import { PartnerService } from '../../core/services/partner.service';

describe('PayoutsComponent', () => {
  let fixture: ComponentFixture<PayoutsComponent>;
  let downloadPayoutStatement: jest.Mock;
  let createObjectUrlMock: jest.Mock<string, [Blob | MediaSource]>;
  let revokeObjectUrlMock: jest.Mock<void, [string]>;
  let clickSpy: jest.SpyInstance<void, []>;
  let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;

  beforeEach(async () => {
    downloadPayoutStatement = jest.fn(() => of(new Blob(['csv'], { type: 'text/csv' })));
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    createObjectUrlMock = jest.fn((sourceFile: Blob | MediaSource) => {
      expect(sourceFile).toBeDefined();
      return 'blob:statement';
    });
    revokeObjectUrlMock = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrlMock,
    });
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

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
                  statement_generated_at: '2026-04-28T00:00:00Z',
                  created_at: '2026-04-05T00:00:00Z',
                },
              ],
              total: 1,
            }),
            downloadPayoutStatement,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PayoutsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL,
    });
    clickSpy.mockRestore();
  });

  it('renders payout settlement details and summary totals', () => {
    const native = fixture.nativeElement as HTMLElement;

    expect(native.textContent).toContain('PO12345');
    expect(native.textContent).toContain('processing');
    expect(native.textContent).toContain('Gross INR 12000.00');
    expect(native.textContent).toContain('Net INR 10200.00');
    expect(native.textContent).toContain('Commission INR 1800.00');
    expect(native.textContent).toContain('Net payable');
  });

  it('downloads a payout statement without revoking on first export', () => {
    fixture.componentInstance.downloadStatement();

    expect(downloadPayoutStatement).toHaveBeenCalledTimes(1);
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('revokes the previous object URL on repeat export', () => {
    fixture.componentInstance.downloadStatement();
    fixture.componentInstance.downloadStatement();

    expect(downloadPayoutStatement).toHaveBeenCalledTimes(2);
    expect(createObjectUrlMock).toHaveBeenCalledTimes(2);
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:statement');
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it('computes totals from empty payouts list', () => {
    // The ?? [] branch: when payouts() returns undefined payouts
    const component = fixture.componentInstance;
    expect(component.totals()).toEqual(expect.objectContaining({ gross: 12000, commission: 1800, net: 10200 }));
  });
});
