import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PartnerService } from '../../core/services/partner.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="table-shell">
      <header>
        <h2>Booking inbox</h2>
        <p>Monitor new bookings, cancellations, and payment state from one responsive list.</p>
      </header>
      <div class="table-shell__list">
        @for (booking of bookings()?.bookings ?? []; track booking.id) {
          <article class="table-shell__row">
            <div><strong>{{ booking.booking_ref }}</strong><span>{{ booking.user_name }}</span></div>
            <div><small>Status</small><span>{{ booking.status }} / {{ booking.payment_status }}</span></div>
            <div><small>Stay</small><span>{{ booking.check_in | date }} to {{ booking.check_out | date }}</span></div>
            <div><small>Total</small><strong>INR {{ booking.total_amount }}</strong></div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    header p { color: var(--pp-text-muted); margin-top: 6px; }
    .table-shell__list { display: grid; gap: 12px; margin-top: 16px; }
    .table-shell__row {
      border-radius: 18px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      padding: 18px;
      display: grid;
      gap: 12px;
    }
    .table-shell__row span,
    .table-shell__row small { display: block; color: var(--pp-text-muted); }
    .table-shell__row strong { display: block; }
    @media (min-width: 900px) {
      .table-shell__row {
        grid-template-columns: 1.4fr 1fr 1.2fr 0.8fr;
        align-items: center;
      }
    }
  `],
})
export class BookingsComponent {
  private partnerService = inject(PartnerService);
  bookings = toSignal(this.partnerService.getBookings(), { initialValue: null });
}
