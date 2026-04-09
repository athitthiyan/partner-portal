import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import { PartnerBooking, PartnerBookingListResponse } from '../../core/models/partner.model';
import { PartnerService } from '../../core/services/partner.service';
import { PlatformSyncService } from '../../core/services/platform-sync.service';

type PartnerTabKey = 'active' | 'past' | 'cancelled';

interface PartnerTab {
  key: PartnerTabKey;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="bookings-shell">
      <!-- Hero header -->
      <div class="bookings-hero">
        <h2>Booking Inbox</h2>
        <p>Monitor bookings, cancellations, and payment state in one synchronized view.</p>
        @if (allBookings().length > 0) {
          <div class="hero-stats">
            <div class="stat-pill stat-pill--active">
              <span class="stat-pill__count">{{ tabCounts().active }}</span>
              <span class="stat-pill__label">Active</span>
            </div>
            <div class="stat-pill stat-pill--past">
              <span class="stat-pill__count">{{ tabCounts().past }}</span>
              <span class="stat-pill__label">Past</span>
            </div>
            <div class="stat-pill stat-pill--cancelled">
              <span class="stat-pill__count">{{ tabCounts().cancelled }}</span>
              <span class="stat-pill__label">Cancelled</span>
            </div>
          </div>
        }
      </div>

      <!-- Tabs (synchronized with customer + admin) -->
      <nav class="tabs" role="tablist">
        @for (tab of tabs; track tab.key) {
          <button
            role="tab"
            class="tab"
            [class.tab--active]="activeTab() === tab.key"
            [attr.aria-selected]="activeTab() === tab.key"
            (click)="setTab(tab.key)"
          >
            <span class="tab__icon">{{ tab.icon }}</span>
            {{ tab.label }}
            @if (tabCounts()[tab.key] > 0) {
              <span class="tab__badge">{{ tabCounts()[tab.key] }}</span>
            }
          </button>
        }
      </nav>

      <!-- Per-tab empty states -->
      @if (filteredBookings().length === 0 && allBookings().length > 0) {
        <div class="state-empty">
          <span class="state-icon">{{ emptyIcon() }}</span>
          <h3>{{ emptyTitle() }}</h3>
          <p>{{ emptySubtitle() }}</p>
        </div>
      }

      @if (allBookings().length === 0) {
        <div class="state-empty">
          <span class="state-icon">📋</span>
          <h3>No bookings yet</h3>
          <p>Once guests start booking, they'll appear here in real-time.</p>
        </div>
      }

      <!-- Booking cards -->
      @if (filteredBookings().length > 0) {
        <div class="bookings-list">
          @for (booking of filteredBookings(); track booking.id) {
            <article class="bk-row">
              <div class="bk-row__primary">
                <div class="bk-row__ref">
                  <strong>{{ booking.booking_ref }}</strong>
                  <span class="bk-row__guest">{{ booking.user_name }}</span>
                </div>
                <div class="bk-row__badges">
                  <span class="status-badge" [style.background]="getStatusBg(booking.status)" [style.color]="getStatusColor(booking.status)">
                    {{ booking.status }}
                  </span>
                  <span class="status-badge" [style.background]="getPaymentBg(booking.payment_status)" [style.color]="getPaymentColor(booking.payment_status)">
                    {{ booking.payment_status }}
                  </span>
                  @if (booking.refund_status) {
                    <span class="status-badge" [style.background]="'rgba(167,139,250,0.15)'" [style.color]="'#a78bfa'">
                      {{ formatRefundStatus(booking.refund_status) }}
                    </span>
                  }
                </div>
              </div>

              <div class="bk-row__details">
                <div class="bk-detail">
                  <span class="bk-detail__label">Check-in</span>
                  <span>{{ booking.check_in | date:'MMM d, yyyy' }}</span>
                </div>
                <div class="bk-detail">
                  <span class="bk-detail__label">Check-out</span>
                  <span>{{ booking.check_out | date:'MMM d, yyyy' }}</span>
                </div>
                <div class="bk-detail">
                  <span class="bk-detail__label">Guests</span>
                  <span>{{ formatGuests(booking) }}</span>
                </div>
                <div class="bk-detail">
                  <span class="bk-detail__label">Total</span>
                  <strong class="bk-detail__amount">INR {{ booking.total_amount | number:'1.0-0' }}</strong>
                </div>
              </div>

              <!-- Partner Action Buttons (pending/processing bookings) -->
              @if (canTakeAction(booking)) {
                <div class="bk-row__actions">
                  <button type="button" class="bk-action bk-action--accept" (click)="acceptBooking(booking)" [disabled]="actionLoading()">
                    Accept Booking
                  </button>
                  <button type="button" class="bk-action bk-action--reject" (click)="rejectBooking(booking)" [disabled]="actionLoading()">
                    Reject & Refund
                  </button>
                </div>
              }

              @if (actionMessage() && lastActionBookingId() === booking.id) {
                <div class="bk-row__message" [class.bk-row__message--error]="!!actionError()">
                  {{ actionMessage() || actionError() }}
                </div>
              }

              <!-- Status Timeline -->
              <div class="status-timeline">
                @for (step of getTimeline(booking); track step.label) {
                  <div class="tl-step" [class.tl-step--done]="step.done" [class.tl-step--current]="step.current">
                    <div class="tl-step__dot"></div>
                    <span class="tl-step__label">{{ step.label }}</span>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .bookings-shell { padding: 0; }

    /* ── Hero ── */
    .bookings-hero {
      margin-bottom: var(--sv-space-lg, 24px);
    }
    .bookings-hero h2 {
      font-family: var(--sv-font-serif, 'Playfair Display', serif);
      font-size: 1.6rem;
      margin: 0 0 4px;
    }
    .bookings-hero p { color: var(--sv-text-muted); margin: 0 0 16px; font-size: .85rem; }

    .hero-stats { display: flex; gap: 10px; flex-wrap: wrap; }
    .stat-pill {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 18px; border-radius: 14px;
      border: 1px solid var(--sv-border); background: rgba(255,255,255,0.02); min-width: 80px;
    }
    .stat-pill__count { font-size: 1.3rem; font-weight: 700; }
    .stat-pill__label { font-size: .62rem; text-transform: uppercase; letter-spacing: .08em; color: var(--sv-text-muted); margin-top: 2px; }
    .stat-pill--active .stat-pill__count { color: #4ade80; }
    .stat-pill--past .stat-pill__count { color: #818cf8; }
    .stat-pill--cancelled .stat-pill__count { color: #f87171; }

    /* ── Tabs ── */
    .tabs {
      display: flex; gap: 4px; margin-bottom: 20px;
      border-bottom: 1px solid var(--sv-border);
    }
    .tab {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 18px; background: none; border: none;
      color: var(--sv-text-muted); font-size: 14px; font-weight: 500;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      cursor: pointer; transition: all 150ms;
    }
    .tab:hover { color: var(--sv-text); }
    .tab--active { color: var(--sv-gold, #d6b86b); border-bottom-color: var(--sv-gold, #d6b86b); }
    .tab__icon { font-size: .9rem; }
    .tab__badge {
      background: var(--sv-gold, #d6b86b); color: #000;
      font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 99px;
    }

    /* ── States ── */
    .state-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 60px 20px; color: var(--sv-text-muted); text-align: center;
    }
    .state-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .state-empty h3 { font-size: 1.1rem; color: var(--sv-text); margin: 0 0 4px; }
    .state-empty p { font-size: .82rem; margin: 0; }

    /* ── Booking Cards ── */
    .bookings-list { display: flex; flex-direction: column; gap: 12px; }

    .bk-row {
      border: 1px solid var(--sv-border); border-radius: 18px;
      background: var(--sv-surface); padding: 18px;
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color 150ms;
    }
    .bk-row:hover { border-color: rgba(214,184,107,.3); }

    .bk-row__primary {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;
    }
    .bk-row__ref strong { display: block; font-size: .88rem; }
    .bk-row__guest { font-size: .75rem; color: var(--sv-text-muted); }

    .bk-row__badges { display: flex; gap: 6px; flex-wrap: wrap; }
    .status-badge {
      font-size: .6rem; font-weight: 600; padding: 3px 10px;
      border-radius: 99px; text-transform: capitalize;
    }

    .bk-row__details {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
    }
    .bk-detail { display: flex; flex-direction: column; gap: 2px; }
    .bk-detail__label {
      font-size: .6rem; text-transform: uppercase; letter-spacing: .06em;
      color: var(--sv-text-muted); font-weight: 600;
    }
    .bk-detail__amount { color: var(--sv-gold-light, #f0d58f); font-size: .9rem; }

    /* ── Timeline ── */
    .status-timeline {
      display: flex; align-items: flex-start; position: relative; padding: 4px 0;
    }
    .tl-step {
      flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; text-align: center;
    }
    .tl-step::before {
      content: ''; position: absolute; top: 6px; left: -50%; right: 50%; height: 2px;
      background: var(--sv-border); z-index: 0;
    }
    .tl-step:first-child::before { display: none; }
    .tl-step--done::before { background: var(--sv-gold, #d6b86b); }
    .tl-step--current::before { background: linear-gradient(90deg, var(--sv-gold, #d6b86b), var(--sv-border)); }

    .tl-step__dot {
      width: 12px; height: 12px; border-radius: 50%; z-index: 1;
      background: var(--sv-border); border: 2px solid var(--sv-bg, #0b1622);
      transition: all 150ms;
    }
    .tl-step--done .tl-step__dot { background: var(--sv-gold, #d6b86b); box-shadow: 0 0 6px rgba(214,184,107,.4); }
    .tl-step--current .tl-step__dot { background: var(--sv-gold, #d6b86b); box-shadow: 0 0 10px rgba(214,184,107,.6); animation: pulse-dot 2s ease-in-out infinite; }

    .tl-step__label {
      font-size: .58rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
      color: var(--sv-text-muted); margin-top: 4px;
    }
    .tl-step--done .tl-step__label { color: var(--sv-text); }
    .tl-step--current .tl-step__label { color: var(--sv-gold, #d6b86b); }

    /* ── Action buttons ── */
    .bk-row__actions {
      display: flex; gap: 10px; flex-wrap: wrap;
      padding-top: 10px;
      border-top: 1px solid var(--sv-border, rgba(255,255,255,0.08));
    }
    .bk-action {
      padding: 10px 20px; border-radius: 12px; font-weight: 700;
      font-size: .82rem; cursor: pointer; border: none;
      transition: all 150ms;
    }
    .bk-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .bk-action--accept {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
    }
    .bk-action--accept:hover:not(:disabled) {
      background: rgba(34, 197, 94, 0.25);
    }
    .bk-action--reject {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
    }
    .bk-action--reject:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.2);
    }
    .bk-row__message {
      font-size: .82rem; padding: 8px 14px; border-radius: 10px;
      background: rgba(34, 197, 94, 0.1); color: #86efac;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .bk-row__message--error {
      background: rgba(239, 68, 68, 0.1); color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.2);
    }

    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 6px rgba(214,184,107,.4); }
      50% { box-shadow: 0 0 14px rgba(214,184,107,.7); }
    }

    /* Mobile default: stacked layout */
    .bk-row__primary { flex-direction: column; gap: 8px; }
    .hero-stats { gap: 8px; }
    .stat-pill { min-width: 70px; padding: 8px 12px; }
    .tabs { overflow-x: auto; }
    .tab { white-space: nowrap; }

    /* md (768px+): restore horizontal layout */
    @media (min-width: 768px) {
      .bk-row__primary { flex-direction: row; gap: 12px; }
      .stat-pill { min-width: 72px; padding: 8px 14px; }
      .status-timeline { flex-wrap: wrap; gap: 4px; }
    }

    /* lg (1024px+): 4-col details */
    @media (min-width: 1024px) {
      .bk-row__details { grid-template-columns: repeat(4, 1fr); }
      .stat-pill { min-width: 80px; }
    }

    /* Small mobile (<480px) */
    @media (max-width: 480px) {
      .bookings-hero h2 { font-size: 1.1rem; }
      .hero-stats { flex-wrap: wrap; }
      .stat-pill { min-width: 60px; padding: 6px 10px; }
      .stat-pill__count { font-size: 1rem; }
      .bk-row__details { grid-template-columns: 1fr; }
      .bk-detail__amount { font-size: .82rem; }
    }
  `],
})
export class BookingsComponent implements OnInit, OnDestroy {
  private partnerService = inject(PartnerService);
  private platformSync = inject(PlatformSyncService);
  private destroy$ = new Subject<void>();
  private bookingsData = toSignal(this.partnerService.getBookings(), { initialValue: null });

  activeTab = signal<PartnerTabKey>('active');

  readonly tabs: PartnerTab[] = [
    { key: 'active', label: 'Active', icon: '🟢' },
    { key: 'past', label: 'Past', icon: '✓' },
    { key: 'cancelled', label: 'Cancelled', icon: '✕' },
  ];

  // ── Status colors (synchronized with customer + admin) ────────────
  private statusColors: Record<string, { color: string; bg: string }> = {
    confirmed:  { color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
    pending:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    processing: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    cancelled:  { color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
    completed:  { color: '#818cf8', bg: 'rgba(99,102,241,0.15)' },
    expired:    { color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' },
  };

  private paymentColors: Record<string, { color: string; bg: string }> = {
    paid:      { color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
    pending:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    failed:    { color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
    refunded:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  };

  ngOnInit(): void {
    this.initRealtimeSync();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Subscribe to booking/payment/refund WebSocket events for auto-refresh */
  private initRealtimeSync(): void {
    this.platformSync.connect();

    this.platformSync.onAny(
      'booking-created',
      'booking-confirmed',
      'booking-cancelled',
      'booking-expired',
      'payment-completed',
      'refund-initiated',
      'refund-completed',
      'inventory-updated',
    ).pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      // toSignal auto-subscribes on init; trigger a re-fetch via the service
      // For partner portal, the bookingsData is toSignal — we re-subscribe manually
      this.partnerService.getBookings().subscribe(res => {
        // Since toSignal can't be re-triggered, update via allBookings cache
        this._bookingsCache = res;
      });
    });
  }

  private _bookingsCache: PartnerBookingListResponse | null = null;

  allBookings(): PartnerBooking[] {
    if (this._bookingsCache) return this._bookingsCache.bookings ?? [];
    return this.bookingsData()?.bookings ?? [];
  }

  filteredBookings(): PartnerBooking[] {
    const all = this.allBookings();
    const tab = this.activeTab();
    const now = new Date();

    switch (tab) {
      case 'active':
        return all.filter(b =>
          (b.status === 'confirmed' || b.status === 'pending' || b.status === 'processing') &&
          new Date(b.check_out) >= now
        );
      case 'past':
        return all.filter(b =>
          b.status === 'completed' ||
          (b.status === 'confirmed' && new Date(b.check_out) < now)
        );
      case 'cancelled':
        return all.filter(b => b.status === 'cancelled');
      default:
        return all;
    }
  }

  tabCounts(): Record<PartnerTabKey, number> {
    const all = this.allBookings();
    const now = new Date();
    return {
      active: all.filter(b =>
        (b.status === 'confirmed' || b.status === 'pending' || b.status === 'processing') &&
        new Date(b.check_out) >= now
      ).length,
      past: all.filter(b =>
        b.status === 'completed' ||
        (b.status === 'confirmed' && new Date(b.check_out) < now)
      ).length,
      cancelled: all.filter(b => b.status === 'cancelled').length,
    };
  }

  setTab(tab: PartnerTabKey): void {
    this.activeTab.set(tab);
  }

  getStatusColor(s: string): string { return this.statusColors[s]?.color ?? '#9ca3af'; }
  getStatusBg(s: string): string { return this.statusColors[s]?.bg ?? 'rgba(107,114,128,0.1)'; }
  getPaymentColor(s: string): string { return this.paymentColors[s]?.color ?? '#9ca3af'; }
  getPaymentBg(s: string): string { return this.paymentColors[s]?.bg ?? 'rgba(107,114,128,0.1)'; }

  // ── Timeline (partner perspective) ────────────────────────────────
  getTimeline(booking: PartnerBooking): { label: string; done: boolean; current: boolean }[] {
    const now = new Date();
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);

    if (booking.status === 'cancelled') {
      return [
        { label: 'Booked', done: true, current: false },
        { label: 'Cancelled', done: true, current: true },
      ];
    }

    return [
      { label: 'Confirmed', done: booking.status === 'confirmed' || booking.status === 'completed', current: false },
      {
        label: 'Checked In',
        done: (booking.status === 'confirmed' && now >= checkIn) || booking.status === 'completed',
        current: booking.status === 'confirmed' && now >= checkIn && now < checkOut,
      },
      {
        label: 'Checked Out',
        done: booking.status === 'completed' || (booking.status === 'confirmed' && now >= checkOut),
        current: booking.status === 'completed',
      },
    ];
  }

  emptyIcon(): string {
    const tab = this.activeTab();
    if (tab === 'active') return '🏨';
    if (tab === 'past') return '📸';
    return '🎉';
  }

  emptyTitle(): string {
    const tab = this.activeTab();
    if (tab === 'active') return 'No active bookings';
    if (tab === 'past') return 'No past bookings yet';
    return 'No cancellations';
  }

  emptySubtitle(): string {
    const tab = this.activeTab();
    if (tab === 'active') return 'Active bookings from guests will appear here.';
    if (tab === 'past') return 'Completed guest stays will show here.';
    return 'Great — all bookings are proceeding smoothly!';
  }

  // ── Accept / Reject ─────────────────────────────────────────────
  actionLoading = signal(false);
  actionMessage = signal('');
  actionError = signal('');
  lastActionBookingId = signal<number | null>(null);

  canTakeAction(booking: PartnerBooking): boolean {
    return booking.status === 'pending' || booking.status === 'processing';
  }

  acceptBooking(booking: PartnerBooking): void {
    this.actionLoading.set(true);
    this.actionMessage.set('');
    this.actionError.set('');
    this.lastActionBookingId.set(booking.id);

    this.partnerService.acceptBooking(booking.id).subscribe({
      next: res => {
        this.actionMessage.set(res.message || 'Booking accepted');
        this.actionLoading.set(false);
        this.refreshBookings();
      },
      error: (err: { error?: { detail?: string } }) => {
        this.actionError.set(err?.error?.detail || 'Failed to accept booking');
        this.actionMessage.set('');
        this.actionLoading.set(false);
      },
    });
  }

  rejectBooking(booking: PartnerBooking): void {
    this.actionLoading.set(true);
    this.actionMessage.set('');
    this.actionError.set('');
    this.lastActionBookingId.set(booking.id);

    this.partnerService.rejectBooking(booking.id).subscribe({
      next: res => {
        this.actionMessage.set(res.message || 'Booking rejected');
        this.actionLoading.set(false);
        this.refreshBookings();
      },
      error: (err: { error?: { detail?: string } }) => {
        this.actionError.set(err?.error?.detail || 'Failed to reject booking');
        this.actionMessage.set('');
        this.actionLoading.set(false);
      },
    });
  }

  private refreshBookings(): void {
    this.partnerService.getBookings().subscribe(res => {
      this._bookingsCache = res;
    });
  }

  formatRefundStatus(status: string): string {
    const map: Record<string, string> = {
      refund_requested: 'Refund Requested',
      refund_initiated: 'Refund Initiated',
      refund_processing: 'Refund Processing',
      refund_success: 'Refund Complete',
      refund_failed: 'Refund Failed',
      refund_reversed: 'Refund Reversed',
    };
    return map[status] || status;
  }

  formatGuests(b: PartnerBooking): string {
    if (b.adults || b.children || b.infants) {
      const parts: string[] = [];
      if (b.adults) parts.push(b.adults + ' Adult' + (b.adults !== 1 ? 's' : ''));
      if (b.children) parts.push(b.children + ' Child' + (b.children !== 1 ? 'ren' : ''));
      if (b.infants) parts.push(b.infants + ' Infant' + (b.infants !== 1 ? 's' : ''));
      return parts.join(' · ');
    }
    return b.guests ? b.guests + ' guest' + (b.guests !== 1 ? 's' : '') : '-';
  }
}
