import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PartnerPayout } from '../../core/models/partner.model';
import { PartnerService } from '../../core/services/partner.service';

@Component({
  selector: 'app-payouts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="payouts">
      <header class="payouts__header">
        <div>
          <h2>Payout ledger</h2>
          <p>Track gross bookings, commission, settlement status, and export-ready partner statements.</p>
        </div>
        <button type="button" class="payouts__action" (click)="downloadStatement()">
          Download Statement
        </button>
      </header>

      <section class="payouts__summary">
        <article>
          <span>Gross</span>
          <strong>{{ formatAmount(totals().gross) }}</strong>
        </article>
        <article>
          <span>Commission</span>
          <strong>{{ formatAmount(totals().commission) }}</strong>
        </article>
        <article>
          <span>Net payable</span>
          <strong>{{ formatAmount(totals().net) }}</strong>
        </article>
      </section>

      <div class="payouts__list">
        @for (payout of payouts().payouts; track payout.id) {
          <article class="payouts__item">
            <div class="payouts__primary">
              <div class="payouts__title-row">
                <strong>{{ payout.payout_reference || 'Pending settlement reference' }}</strong>
                <span class="payouts__status" [attr.data-status]="payout.status">
                  {{ humanizeStatus(payout.status) }}
                </span>
              </div>
              <p>Booking #{{ payout.booking_id || 'Settlement pending booking assignment' }}</p>
              <p>Settlement date: {{ payout.payout_date ? formatDate(payout.payout_date) : 'Awaiting finance release' }}</p>
              <p>Statement generated: {{ payout.statement_generated_at ? formatDate(payout.statement_generated_at) : 'Not yet exported' }}</p>
            </div>

            <div class="payouts__money">
              <p>Gross {{ formatAmount(payout.gross_amount) }}</p>
              <p>Commission {{ formatAmount(payout.commission_amount) }}</p>
              <strong>Net {{ formatAmount(payout.net_amount) }}</strong>
            </div>
          </article>
        } @empty {
          <article class="payouts__empty">
            <strong>No payouts yet</strong>
            <p>Settlements will appear here after your first confirmed Stayvora bookings.</p>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .payouts { display: grid; gap: 20px; }
    .payouts__header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .payouts__header p { color: var(--sv-text-muted); margin-top: 6px; max-width: 60ch; }
    .payouts__action {
      border: 1px solid rgba(214, 185, 96, 0.45);
      background: linear-gradient(135deg, rgba(214, 185, 96, 0.18), rgba(214, 185, 96, 0.06));
      color: var(--sv-text);
      border-radius: 999px;
      padding: 10px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .payouts__summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .payouts__summary article,
    .payouts__item,
    .payouts__empty {
      border-radius: 18px;
      border: 1px solid var(--sv-border);
      background: var(--sv-surface);
      box-shadow: 0 16px 30px rgba(5, 11, 28, 0.18);
    }
    .payouts__summary article {
      padding: 18px;
      display: grid;
      gap: 8px;
    }
    .payouts__summary span,
    .payouts__item p,
    .payouts__empty p {
      color: var(--sv-text-muted);
    }
    .payouts__list { display: grid; gap: 12px; }
    .payouts__item {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .payouts__primary,
    .payouts__money {
      display: grid;
      gap: 8px;
    }
    .payouts__title-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .payouts__status {
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }
    .payouts__status[data-status='pending'],
    .payouts__status[data-status='processing'] {
      background: rgba(214, 185, 96, 0.12);
      border-color: rgba(214, 185, 96, 0.28);
      color: #f6df8b;
    }
    .payouts__status[data-status='settled'] {
      background: rgba(82, 194, 117, 0.12);
      border-color: rgba(82, 194, 117, 0.3);
      color: #85e9a1;
    }
    .payouts__status[data-status='failed'],
    .payouts__status[data-status='reversed'] {
      background: rgba(255, 111, 111, 0.12);
      border-color: rgba(255, 111, 111, 0.28);
      color: #ff9b9b;
    }
    .payouts__empty {
      padding: 24px;
      display: grid;
      gap: 8px;
    }
  `],
})
export class PayoutsComponent {
  private partnerService = inject(PartnerService);

  readonly payouts = toSignal(this.partnerService.getPayouts(), {
    initialValue: { payouts: [], total: 0 },
  });
  readonly totals = computed(() => {
    const list = this.payouts().payouts;
    return list.reduce(
      (summary, payout) => ({
        gross: summary.gross + payout.gross_amount,
        commission: summary.commission + payout.commission_amount,
        net: summary.net + payout.net_amount,
      }),
      { gross: 0, commission: 0, net: 0 },
    );
  });
  readonly downloadUrl = signal<string | null>(null);

  humanizeStatus(status: PartnerPayout['status']): string {
    return status.replace('_', ' ');
  }

  formatAmount(amount: number): string {
    return `INR ${amount.toFixed(2)}`;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  downloadStatement(): void {
    this.partnerService.downloadPayoutStatement().subscribe((file) => {
      const previousUrl = this.downloadUrl();
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      const nextUrl = URL.createObjectURL(file);
      this.downloadUrl.set(nextUrl);
      const link = document.createElement('a');
      link.href = nextUrl;
      link.download = 'stayvora-payout-statement.csv';
      link.click();
    });
  }
}
