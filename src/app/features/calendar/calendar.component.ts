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

      <div class="calendar__grid">
        @for (day of calendar(); track day.date) {
          <article class="calendar__day" [class.calendar__day--blocked]="day.available_units === 0">
            <div class="calendar__day-top">
              <strong>{{ day.date }}</strong>
              <span>INR {{ day.effective_price }}</span>
            </div>
            <span>Total: {{ day.total_units }}</span>
            <span>Available: {{ day.available_units }}</span>
            <span>Booked: {{ day.booked_units }}</span>
            <span>Held: {{ day.locked_units }}</span>
            <span>Blocked: {{ day.blocked_units }}</span>
            <small>{{ day.block_reason || day.status }}</small>
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
      grid-template-columns: 1fr minmax(220px, 280px);
      align-items: end;
    }
    .calendar__eyebrow {
      margin: 0 0 8px;
      color: var(--pp-primary);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .calendar__head p:last-child { color: var(--pp-text-muted); margin-top: 6px; }
    .calendar__controls,
    .calendar__day,
    .calendar__head select {
      border-radius: 20px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
    }
    .calendar__controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      padding: 18px;
    }
    label {
      display: grid;
      gap: 8px;
      color: var(--pp-text-muted);
      font-size: 0.92rem;
    }
    input,
    select,
    button {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface-2);
      color: var(--pp-text);
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
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
      color: #111722;
      border: none;
    }
    .calendar__secondary { background: transparent; }
    .calendar__grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
    .calendar__day {
      padding: 16px;
      display: grid;
      gap: 6px;
      box-shadow: 0 12px 28px rgba(4, 9, 18, 0.18);
    }
    .calendar__day--blocked {
      border-color: rgba(248, 113, 113, 0.4);
      background: linear-gradient(180deg, rgba(61, 22, 29, 0.88), rgba(28, 18, 22, 0.92));
    }
    .calendar__day span,
    .calendar__day small { color: var(--pp-text-muted); }
    .calendar__day-top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      color: var(--pp-text);
    }
    @media (max-width: 860px) {
      .calendar__head { grid-template-columns: 1fr; }
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

  private loadCalendar(roomId: number) {
    this.partnerService.getCalendar(roomId, this.range.start_date).subscribe(response => {
      this.calendar.set(response.days);
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
