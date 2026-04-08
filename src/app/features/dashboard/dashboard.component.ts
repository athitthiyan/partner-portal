import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PartnerService } from '../../core/services/partner.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard">
      <div class="dashboard__hero">
        <div>
          <p class="dashboard__eyebrow">Revenue foundation</p>
          <h2>Operate your hotel like a live marketplace partner</h2>
          <p>Rates, occupancy, GST-ready details, payouts, and bookings are all connected now.</p>
        </div>
      </div>

      <div class="dashboard__metrics">
        @for (card of metricCards(); track card.label) {
          <article class="dashboard__card">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .dashboard { display: grid; gap: 18px; }
    .dashboard__hero,
    .dashboard__card {
      border-radius: 22px;
      border: 1px solid var(--sv-border);
      background: linear-gradient(180deg, rgba(18, 31, 53, 0.96), rgba(15, 24, 40, 0.96));
      padding: 20px;
    }
    .dashboard__eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--sv-gold);
      font-size: 0.78rem;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .dashboard__hero h2 {
      margin-bottom: 10px;
      font-size: 1.7rem;
    }
    .dashboard__hero p:last-child,
    .dashboard__card span {
      color: var(--sv-text-muted);
    }
    .dashboard__metrics {
      display: grid;
      gap: 14px;
    }
    .dashboard__card strong {
      display: block;
      margin-top: 8px;
      font-size: 2rem;
    }
    /* Tablet (768–900px): 2-col grid */
    @media (min-width: 768px) and (max-width: 899px) {
      .dashboard__metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .dashboard__card strong { font-size: 1.6rem; }
    }

    /* Desktop (900px+): 4-col grid */
    @media (min-width: 900px) {
      .dashboard__metrics {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    /* Mobile (<768px): 1-col stacked */
    @media (max-width: 767px) {
      .dashboard__metrics { gap: 10px; }
      .dashboard__card strong { font-size: 1.5rem; }
    }
  `],
})
export class DashboardComponent {
  private partnerService = inject(PartnerService);

  metricCards = toSignal(
    this.partnerService.getRevenue().pipe(
      map(revenue => [
        { label: 'Gross revenue', value: `INR ${revenue.gross_revenue}` },
        { label: 'Net revenue', value: `INR ${revenue.net_revenue}` },
        { label: 'Confirmed bookings', value: String(revenue.confirmed_bookings) },
        { label: 'Pending payouts', value: `INR ${revenue.pending_payouts}` },
      ]),
    ),
    {
      initialValue: [
        { label: 'Gross revenue', value: 'INR 0' },
        { label: 'Net revenue', value: 'INR 0' },
        { label: 'Confirmed bookings', value: '0' },
        { label: 'Pending payouts', value: 'INR 0' },
      ],
    },
  );
}
