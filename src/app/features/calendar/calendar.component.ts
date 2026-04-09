import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerCalendarDay, PartnerRoom } from '../../core/models/partner.model';
import { PartnerService } from '../../core/services/partner.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="calendar">
      <header class="calendar__head">
        <div>
          <p class="calendar__eyebrow">Inventory Calendar</p>
          <h2>Daily inventory and pricing controls</h2>
          <p>Adjust sellable rooms, block maintenance dates, and push date-range pricing overrides instantly.</p>
        </div>

        <label>
          Room type
          <select [ngModel]="selectedRoomId()" (ngModelChange)="onRoomChange($event)">
            @for (room of rooms(); track room.id) {
              <option [value]="room.id">{{ room.room_type_name }}</option>
            }
          </select>
        </label>
      </header>

      <form class="calendar__controls" (ngSubmit)="applyInventoryUpdate()">
        <label>
          Start date
          <input type="date" name="start_date" [(ngModel)]="range.start_date" required />
        </label>
        <label>
          End date
          <input type="date" name="end_date" [(ngModel)]="range.end_date" required />
        </label>
        <label>
          Available rooms
          <input type="number" name="available_units" min="0" [(ngModel)]="range.available_units" />
        </label>
        <label>
          Block rooms
          <input type="number" name="blocked_units" min="0" [(ngModel)]="range.blocked_units" />
        </label>
        <label>
          Block reason
          <input name="block_reason" [(ngModel)]="range.block_reason" placeholder="Maintenance / blackout" />
        </label>
        <label>
          Override price
          <input type="number" name="price" min="0" [(ngModel)]="range.price" />
        </label>
        <div class="calendar__actions">
          <button type="submit">Update inventory</button>
          <button type="button" class="calendar__secondary" (click)="quickBlock()">Quick block</button>
          <button type="button" class="calendar__secondary" (click)="quickUnblock()">Quick unblock</button>
          <button type="button" class="calendar__secondary" (click)="updatePricing()">Save pricing</button>
        </div>
      </form>

      <!-- Legend -->
      <div class="calendar__legend">
        <span class="calendar__legend-item"><span class="calendar__dot calendar__dot--available"></span> Available</span>
        <span class="calendar__legend-item"><span class="calendar__dot calendar__dot--booked"></span> Booked</span>
        <span class="calendar__legend-item"><span class="calendar__dot calendar__dot--held"></span> Held</span>
        <span class="calendar__legend-item"><span class="calendar__dot calendar__dot--blocked"></span> Blocked</span>
        <span class="calendar__legend-item"><span class="calendar__dot calendar__dot--full"></span> Sold Out</span>
      </div>

      <div class="calendar__grid">
        @for (day of calendar(); track day.date) {
          <article class="calendar__day"
            [class.calendar__day--blocked]="day.available_units === 0 && day.blocked_units > 0"
            [class.calendar__day--full]="day.available_units === 0 && day.booked_units > 0 && day.blocked_units === 0"
            [class.calendar__day--low]="day.available_units > 0 && day.available_units <= 2"
            [class.calendar__day--healthy]="day.available_units > 2"
            (click)="selectDay(day)"
            (keydown.enter)="selectDay(day)"
            tabindex="0"
          >
            <div class="calendar__day-header">
              <strong class="calendar__day-date">{{ formatDayLabel(day.date) }}</strong>
              <span class="calendar__day-price">\u20B9{{ day.effective_price }}</span>
            </div>

            <div class="calendar__day-bars">
              <div class="calendar__bar">
                <div class="calendar__bar-fill calendar__bar-fill--booked" [style.width.%]="barPercent(day.booked_units, day.total_units)"></div>
                <div class="calendar__bar-fill calendar__bar-fill--held" [style.width.%]="barPercent(day.locked_units, day.total_units)" [style.left.%]="barPercent(day.booked_units, day.total_units)"></div>
                <div class="calendar__bar-fill calendar__bar-fill--blocked" [style.width.%]="barPercent(day.blocked_units, day.total_units)" [style.left.%]="barPercent(day.booked_units + day.locked_units, day.total_units)"></div>
              </div>
            </div>

            <div class="calendar__day-stats">
              <span class="calendar__stat"><span class="calendar__dot calendar__dot--available"></span>{{ day.available_units }}</span>
              <span class="calendar__stat"><span class="calendar__dot calendar__dot--booked"></span>{{ day.booked_units }}</span>
              @if (day.locked_units > 0) {
                <span class="calendar__stat"><span class="calendar__dot calendar__dot--held"></span>{{ day.locked_units }}</span>
              }
              @if (day.blocked_units > 0) {
                <span class="calendar__stat"><span class="calendar__dot calendar__dot--blocked"></span>{{ day.blocked_units }}</span>
              }
            </div>

            @if (day.block_reason) {
              <small class="calendar__day-reason">{{ day.block_reason }}</small>
            }
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .calendar { display: grid; gap: 18px; }
    .calendar__head {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
      align-items: end;
    }
    .calendar__eyebrow {
      margin: 0 0 8px;
      color: var(--sv-gold);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .calendar__head p:last-child { color: var(--sv-text-muted); margin-top: 6px; }
    .calendar__controls,
    .calendar__day,
    .calendar__head select {
      border-radius: 20px;
      border: 1px solid var(--sv-border);
      background: var(--sv-surface);
    }
    .calendar__controls {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 18px;
    }
    label {
      display: grid;
      gap: 8px;
      color: var(--sv-text-muted);
      font-size: 0.92rem;
    }
    input,
    select,
    button {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--sv-border);
      background: var(--sv-surface-2);
      color: var(--sv-text);
    }
    .calendar__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: end;
    }
    .calendar__actions button {
      width: auto;
      min-width: 140px;
      font-weight: 700;
    }
    .calendar__actions button:first-child {
      background: var(--sv-gradient-gold);
      color: #111722;
      border: none;
    }
    .calendar__secondary { background: transparent; }
    .calendar__legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 12px 16px;
      border-radius: 14px;
      background: var(--sv-surface, rgba(17,25,40,0.8));
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
    }
    .calendar__legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: var(--sv-text-muted);
    }
    .calendar__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .calendar__dot--available { background: #22c55e; }
    .calendar__dot--booked { background: #6366f1; }
    .calendar__dot--held { background: #f59e0b; }
    .calendar__dot--blocked { background: #ef4444; }
    .calendar__dot--full { background: #9ca3af; }

    .calendar__grid {
      display: grid;
      gap: 10px;
      grid-template-columns: 1fr;
    }
    .calendar__day {
      padding: 14px;
      display: grid;
      gap: 8px;
      border-radius: 16px;
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      background: var(--sv-surface, rgba(17,25,40,0.8));
      box-shadow: 0 8px 24px rgba(4, 9, 18, 0.15);
      cursor: pointer;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .calendar__day:hover {
      border-color: rgba(214, 184, 107, 0.3);
      transform: translateY(-2px);
    }
    .calendar__day--blocked {
      border-color: rgba(239, 68, 68, 0.4);
      background: linear-gradient(180deg, rgba(61, 22, 29, 0.7), rgba(28, 18, 22, 0.85));
    }
    .calendar__day--full {
      border-color: rgba(156, 163, 175, 0.3);
      background: linear-gradient(180deg, rgba(40, 40, 55, 0.8), rgba(28, 28, 40, 0.85));
    }
    .calendar__day--low {
      border-color: rgba(245, 158, 11, 0.3);
    }
    .calendar__day--healthy {
      border-color: rgba(34, 197, 94, 0.2);
    }
    .calendar__day-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
    }
    .calendar__day-date {
      font-size: 0.85rem;
      color: var(--sv-text, #f0f4ff);
    }
    .calendar__day-price {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--sv-gold, #d6b86b);
    }
    .calendar__day-bars {
      position: relative;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.06);
      overflow: hidden;
    }
    .calendar__bar {
      position: relative;
      height: 100%;
    }
    .calendar__bar-fill {
      position: absolute;
      top: 0;
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .calendar__bar-fill--booked { background: #6366f1; }
    .calendar__bar-fill--held { background: #f59e0b; }
    .calendar__bar-fill--blocked { background: #ef4444; }
    .calendar__day-stats {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .calendar__stat {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      color: var(--sv-text-muted, #8a9bbf);
    }
    .calendar__day-reason {
      font-size: 0.72rem;
      color: #f87171;
      font-style: italic;
    }
    @media (min-width: 768px) {
      .calendar__head { grid-template-columns: 1fr minmax(220px, 280px); }
      .calendar__controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .calendar__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (min-width: 1024px) {
      .calendar__controls { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .calendar__grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    @media (min-width: 1440px) {
      .calendar__grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }
    }
  `],
})
export class CalendarComponent {
  private partnerService = inject(PartnerService);

  rooms = signal<PartnerRoom[]>([]);
  calendar = signal<PartnerCalendarDay[]>([]);
  selectedRoomId = signal<number | null>(null);
  range = {
    start_date: this.today(),
    end_date: this.today(),
    available_units: 0,
    blocked_units: 0,
    block_reason: 'maintenance',
    price: 0,
  };

  constructor() {
    this.partnerService.getRooms().subscribe(response => {
      this.rooms.set(response.rooms);
      const firstRoomId = response.rooms[0]?.id ?? null;
      this.selectedRoomId.set(firstRoomId);
      if (firstRoomId) {
        this.loadCalendar(firstRoomId);
      }
    });
  }

  onRoomChange(roomId: number | string) {
    const parsed = Number(roomId);
    this.selectedRoomId.set(parsed);
    this.loadCalendar(parsed);
  }

  applyInventoryUpdate() {
    const roomId = this.selectedRoomId();
    if (!roomId) {
      return;
    }
    this.partnerService.updateInventory({
      room_type_id: roomId,
      start_date: this.range.start_date,
      end_date: this.range.end_date,
      available_units: this.range.available_units,
      blocked_units: this.range.blocked_units,
      block_reason: this.range.block_reason,
      status: 'available',
    }).subscribe(response => this.calendar.set(response.days));
  }

  quickBlock() {
    const roomId = this.selectedRoomId();
    if (!roomId) {
      return;
    }
    this.partnerService.blockInventory({
      room_type_id: roomId,
      start_date: this.range.start_date,
      end_date: this.range.end_date,
      blocked_units: this.range.blocked_units || undefined,
      block_reason: this.range.block_reason,
      status: 'blocked',
    }).subscribe(response => this.calendar.set(response.days));
  }

  quickUnblock() {
    const roomId = this.selectedRoomId();
    if (!roomId) {
      return;
    }
    this.partnerService.unblockInventory({
      room_type_id: roomId,
      start_date: this.range.start_date,
      end_date: this.range.end_date,
      blocked_units: this.range.blocked_units || undefined,
      status: 'available',
    }).subscribe(response => this.calendar.set(response.days));
  }

  updatePricing() {
    const roomId = this.selectedRoomId();
    if (!roomId || !this.range.price) {
      return;
    }
    this.partnerService.updatePricing({
      room_type_id: roomId,
      start_date: this.range.start_date,
      end_date: this.range.end_date,
      price: this.range.price,
      label: this.range.block_reason || 'override',
    }).subscribe(() => this.loadCalendar(roomId));
  }

  selectDay(day: PartnerCalendarDay): void {
    this.range.start_date = day.date;
    this.range.end_date = day.date;
    this.range.available_units = day.available_units;
    this.range.blocked_units = day.blocked_units;
    this.range.block_reason = day.block_reason || '';
    this.range.price = day.effective_price;
  }

  formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
  }

  barPercent(value: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }

  private loadCalendar(roomId: number) {
    this.partnerService.getCalendar(roomId, this.range.start_date).subscribe(response => {
      this.calendar.set(response.days);
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
