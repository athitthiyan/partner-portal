import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PartnerService } from '../../core/services/partner.service';

@Component({
  selector: 'app-payouts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="payouts">
      <header>
        <h2>Payouts and settlements</h2>
        <p>Track commission, net settlement, payout references, and partner cash flow.</p>
      </header>
      <div class="payouts__list">
        @for (payout of payouts()?.payouts ?? []; track payout.id) {
          <article class="payouts__item">
            <div>
              <strong>{{ payout.payout_reference || 'Pending settlement' }}</strong>
              <p>Status: {{ payout.status }}</p>
            </div>
            <div>
              <p>Gross INR {{ payout.gross_amount }}</p>
              <p>Commission INR {{ payout.commission_amount }}</p>
              <strong>Net INR {{ payout.net_amount }}</strong>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    header p { color: var(--pp-text-muted); margin-top: 6px; }
    .payouts__list { display: grid; gap: 12px; margin-top: 16px; }
    .payouts__item {
      border-radius: 18px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      padding: 18px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .payouts__item p { color: var(--pp-text-muted); margin-top: 6px; }
  `],
})
export class PayoutsComponent {
  private partnerService = inject(PartnerService);
  payouts = toSignal(this.partnerService.getPayouts(), { initialValue: null });
}
