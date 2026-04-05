import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerRoom } from '../../core/models/partner.model';
import { PartnerService } from '../../core/services/partner.service';

type PartnerRoomType = PartnerRoom['room_type'];

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rooms">
      <header class="rooms__head">
        <div>
          <p class="rooms__eyebrow">Inventory Setup</p>
          <h2>Room type and pricing management</h2>
          <p>Define sellable room types, capacity, nightly pricing, and whether each type is live on Stayvora.</p>
        </div>
      </header>

      <form class="rooms__form" (ngSubmit)="saveRoomType()">
        <div class="rooms__grid">
          <label>
            Room category
            <select name="room_type" [(ngModel)]="draft.room_type">
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
              <option value="penthouse">Penthouse</option>
            </select>
          </label>

          <label>
            Public room type name
            <input name="room_type_name" [(ngModel)]="draft.room_type_name" placeholder="Family Room" required />
          </label>

          <label>
            Total room count
            <input name="total_room_count" type="number" min="1" [(ngModel)]="draft.total_room_count" required />
          </label>

          <label>
            Max guests
            <input name="max_guests" type="number" min="1" [(ngModel)]="draft.max_guests" required />
          </label>

          <label>
            Base price
            <input name="price" type="number" min="1" [(ngModel)]="draft.price" required />
          </label>

          <label>
            Weekend price
            <input name="weekend_price" type="number" min="1" [(ngModel)]="draft.weekend_price" />
          </label>

          <label>
            Holiday price
            <input name="holiday_price" type="number" min="1" [(ngModel)]="draft.holiday_price" />
          </label>

          <label>
            Extra guest charge
            <input name="extra_guest_charge" type="number" min="0" [(ngModel)]="draft.extra_guest_charge" />
          </label>

          <label>
            Beds
            <input name="beds" type="number" min="1" [(ngModel)]="draft.beds" />
          </label>

          <label>
            Bathrooms
            <input name="bathrooms" type="number" min="1" [(ngModel)]="draft.bathrooms" />
          </label>

          <label class="rooms__toggle">
            <input name="is_active" type="checkbox" [(ngModel)]="draft.is_active" />
            Active on customer app
          </label>

          <label class="rooms__toggle">
            <input name="availability" type="checkbox" [(ngModel)]="draft.availability" />
            Available for booking
          </label>
        </div>

        <label>
          Description
          <textarea name="description" [(ngModel)]="draft.description" placeholder="Ocean-view suite with balcony"></textarea>
        </label>

        <label>
          Amenities
          <input name="amenities" [(ngModel)]="amenityInput" placeholder="WiFi, Breakfast, Pool" />
        </label>

        <div class="rooms__actions">
          <button type="submit">{{ editingId() ? 'Update room type' : 'Create room type' }}</button>
          @if (editingId()) {
            <button type="button" class="rooms__secondary" (click)="resetDraft()">Cancel edit</button>
          }
        </div>
      </form>

      <div class="rooms__cards">
        @for (room of rooms(); track room.id) {
          <article class="rooms__card">
            <div class="rooms__card-head">
              <div>
                <p class="rooms__pill">{{ room.room_type_name }}</p>
                <h3>{{ room.hotel_name }}</h3>
              </div>
              <span class="rooms__status" [class.rooms__status--inactive]="!room.is_active">
                {{ room.is_active ? 'Live' : 'Paused' }}
              </span>
            </div>

            <dl class="rooms__facts">
              <div><dt>Total rooms</dt><dd>{{ room.total_room_count }}</dd></div>
              <div><dt>Base</dt><dd>INR {{ room.price }}</dd></div>
              <div><dt>Weekend</dt><dd>{{ room.weekend_price ? ('INR ' + room.weekend_price) : 'Base price' }}</dd></div>
              <div><dt>Holiday</dt><dd>{{ room.holiday_price ? ('INR ' + room.holiday_price) : 'Override by calendar' }}</dd></div>
            </dl>

            <p class="rooms__description">{{ room.description || 'No description provided yet.' }}</p>

            <div class="rooms__card-actions">
              <button type="button" class="rooms__secondary" (click)="editRoom(room)">Edit</button>
              <button type="button" class="rooms__secondary" (click)="toggleRoom(room)">
                {{ room.is_active ? 'Deactivate' : 'Activate' }}
              </button>
              <button type="button" class="rooms__danger" (click)="deleteRoom(room.id)">Archive</button>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .rooms { display: grid; gap: 20px; }
    .rooms__eyebrow {
      margin: 0 0 8px;
      color: var(--pp-primary);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .rooms__head p:last-child { color: var(--pp-text-muted); margin-top: 6px; }
    .rooms__form,
    .rooms__card {
      border-radius: 24px;
      border: 1px solid var(--pp-border);
      background: linear-gradient(180deg, var(--pp-surface), rgba(17, 25, 40, 0.92));
      padding: 20px;
      box-shadow: 0 16px 34px rgba(4, 9, 18, 0.22);
    }
    .rooms__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    label {
      display: grid;
      gap: 8px;
      color: var(--pp-text-muted);
      font-size: 0.92rem;
    }
    input,
    select,
    textarea,
    button {
      width: 100%;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface-2);
      color: var(--pp-text);
    }
    textarea { min-height: 96px; resize: vertical; }
    .rooms__toggle {
      align-items: center;
      grid-auto-flow: column;
      justify-content: start;
    }
    .rooms__toggle input {
      width: 18px;
      height: 18px;
      padding: 0;
    }
    .rooms__actions,
    .rooms__card-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .rooms__actions button,
    .rooms__card-actions button {
      width: auto;
      min-width: 140px;
      font-weight: 700;
    }
    .rooms__actions button:first-child {
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
      color: #111722;
      border: none;
    }
    .rooms__secondary { background: transparent; }
    .rooms__danger {
      border-color: rgba(248, 113, 113, 0.45);
      color: #fecaca;
      background: rgba(127, 29, 29, 0.16);
    }
    .rooms__cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
    }
    .rooms__card-head,
    .rooms__facts {
      display: grid;
      gap: 12px;
    }
    .rooms__card-head {
      grid-template-columns: 1fr auto;
      align-items: start;
    }
    .rooms__pill {
      display: inline-flex;
      width: fit-content;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(212, 184, 93, 0.12);
      color: var(--pp-primary);
      font-weight: 700;
    }
    .rooms__status {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.18);
      color: #86efac;
      font-weight: 700;
    }
    .rooms__status--inactive {
      background: rgba(148, 163, 184, 0.14);
      color: #cbd5e1;
    }
    .rooms__facts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin: 16px 0;
    }
    .rooms__facts div {
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.03);
    }
    .rooms__facts dt {
      color: var(--pp-text-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .rooms__facts dd {
      margin: 6px 0 0;
      color: var(--pp-text);
      font-weight: 700;
    }
    .rooms__description { color: var(--pp-text-muted); }
  `],
})
export class RoomsComponent {
  private partnerService = inject(PartnerService);

  rooms = signal<PartnerRoom[]>([]);
  total = signal(0);
  editingId = signal<number | null>(null);
  amenityInput = '';
  draft = this.createDraft();

  constructor() {
    this.loadRooms();
  }

  saveRoomType() {
    const payload = {
      ...this.draft,
      amenities: this.amenityInput.split(',').map(value => value.trim()).filter(Boolean),
      gallery_urls: [],
      location: 'Partner-managed location',
      city: 'Chennai',
      country: 'India',
    };
    const request = this.editingId()
      ? this.partnerService.updateRoom(this.editingId()!, payload)
      : this.partnerService.createRoom(payload);

    request.subscribe(() => {
      this.loadRooms();
      this.resetDraft();
    });
  }

  editRoom(room: PartnerRoom) {
    this.editingId.set(room.id);
    this.amenityInput = room.amenities.join(', ');
    this.draft = {
      room_type: room.room_type,
      room_type_name: room.room_type_name,
      description: room.description ?? '',
      price: room.price,
      original_price: room.original_price ?? null,
      total_room_count: room.total_room_count,
      weekend_price: room.weekend_price ?? null,
      holiday_price: room.holiday_price ?? null,
      extra_guest_charge: room.extra_guest_charge,
      max_guests: room.max_guests,
      beds: room.beds,
      bathrooms: room.bathrooms,
      is_active: room.is_active,
      availability: room.availability,
    };
  }

  toggleRoom(room: PartnerRoom) {
    this.partnerService.updateRoom(room.id, {
      is_active: !room.is_active,
      availability: !room.is_active,
    }).subscribe(() => this.loadRooms());
  }

  deleteRoom(roomId: number) {
    this.partnerService.deleteRoom(roomId).subscribe(() => this.loadRooms());
  }

  resetDraft() {
    this.editingId.set(null);
    this.amenityInput = '';
    this.draft = this.createDraft();
  }

  private createDraft(): {
    room_type: PartnerRoomType;
    room_type_name: string;
    description: string;
    price: number;
    original_price: number | null;
    total_room_count: number;
    weekend_price: number | null;
    holiday_price: number | null;
    extra_guest_charge: number;
    max_guests: number;
    beds: number;
    bathrooms: number;
    is_active: boolean;
    availability: boolean;
  } {
    return {
      room_type: 'suite',
      room_type_name: 'Suite',
      description: '',
      price: 3500,
      original_price: 4200,
      total_room_count: 10,
      weekend_price: 4200,
      holiday_price: null,
      extra_guest_charge: 500,
      max_guests: 2,
      beds: 1,
      bathrooms: 1,
      is_active: true,
      availability: true,
    };
  }

  private loadRooms() {
    this.partnerService.getRooms().subscribe(response => {
      this.rooms.set(response.rooms);
      this.total.set(response.total);
    });
  }
}
