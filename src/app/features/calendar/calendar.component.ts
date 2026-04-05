import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { PartnerService } from '../../core/services/partner.service';
import { PartnerCalendarDay } from '../../core/models/partner.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="calendar">
      <header>
        <h2>Availability calendar</h2>
        <p>Keep occupancy, sellable rooms, and locked inventory aligned with live bookings.</p>
      </header>
      <div class="calendar__grid">
        @for (day of calendar(); track day.date) {
          <article class="calendar__day">
            <strong>{{ day.date }}</strong>
            <span>Total: {{ day.total_units }}</span>
            <span>Available: {{ day.available_units }}</span>
            <span>Locked: {{ day.locked_units }}</span>
            <small>{{ day.status }}</small>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    header p { color: var(--pp-text-muted); margin-top: 6px; }
    .calendar__grid {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }
    .calendar__day {
      border-radius: 16px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      padding: 16px;
      display: grid;
      gap: 6px;
    }
    .calendar__day span,
    .calendar__day small { color: var(--pp-text-muted); }
    @media (min-width: 768px) {
      .calendar__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 1100px) {
      .calendar__grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    }
  `],
})
export class CalendarComponent {
  private partnerService = inject(PartnerService);

  calendar = signal<PartnerCalendarDay[]>([]);

  constructor() {
    this.partnerService.getRooms().subscribe(response => {
      const firstRoomId = response.rooms[0]?.id;
      if (!firstRoomId) {
        this.calendar.set([]);
        return;
      }
      this.partnerService.getCalendar(firstRoomId).subscribe(calendar => {
        this.calendar.set(calendar.days);
      });
    });
  }
}
