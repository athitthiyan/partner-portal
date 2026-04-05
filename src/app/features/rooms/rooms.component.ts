import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../core/services/partner.service';
import { PartnerRoom } from '../../core/models/partner.model';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rooms">
      <header class="rooms__head">
        <div>
          <h2>Room inventory</h2>
          <p>Add and update sellable room types, images, amenities, and pricing.</p>
        </div>
      </header>

      <form class="rooms__form" (ngSubmit)="createRoom()">
        <input name="room_type" [(ngModel)]="draft.room_type" placeholder="Room type: suite" required />
        <input name="price" type="number" [(ngModel)]="draft.price" placeholder="Base price" required />
        <input name="original_price" type="number" [(ngModel)]="draft.original_price" placeholder="Strike price" />
        <input name="image_url" [(ngModel)]="draft.image_url" placeholder="Primary image URL" />
        <input name="amenities" [(ngModel)]="amenityInput" placeholder="Amenities comma separated" />
        <input name="gallery" [(ngModel)]="galleryInput" placeholder="Gallery URLs comma separated" />
        <textarea name="description" [(ngModel)]="draft.description" placeholder="Room description"></textarea>
        <button type="submit">Add room</button>
      </form>

      <div class="rooms__list">
        @for (room of rooms(); track room.id) {
          <article class="rooms__item">
            <div>
              <h3>{{ room.hotel_name }} - {{ room.room_type }}</h3>
              <p>{{ room.description || 'No description yet' }}</p>
              <small>{{ room.amenities.join(', ') || 'No amenities yet' }}</small>
            </div>
            <strong>INR {{ room.price }}</strong>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .rooms { display: grid; gap: 18px; }
    .rooms__head p { color: var(--pp-text-muted); margin-top: 6px; }
    .rooms__form, .rooms__item {
      border-radius: 20px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      padding: 18px;
    }
    .rooms__form {
      display: grid;
      gap: 12px;
    }
    .rooms__form input,
    .rooms__form textarea,
    .rooms__form button {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface-2);
      color: var(--pp-text);
    }
    .rooms__form button {
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
      color: #10151f;
      border: none;
      font-weight: 700;
    }
    .rooms__list {
      display: grid;
      gap: 12px;
    }
    .rooms__item {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .rooms__item p,
    .rooms__item small {
      color: var(--pp-text-muted);
      display: block;
      margin-top: 6px;
    }
  `],
})
export class RoomsComponent {
  private partnerService = inject(PartnerService);

  rooms = signal<PartnerRoom[]>([]);
  total = signal(0);
  amenityInput = '';
  galleryInput = '';
  draft = {
    room_type: 'suite',
    description: '',
    price: 3500,
    original_price: 4200,
    image_url: '',
  };

  constructor() {
    this.loadRooms();
  }

  createRoom() {
    this.partnerService.createRoom({
      ...this.draft,
      amenities: this.amenityInput.split(',').map(value => value.trim()).filter(Boolean),
      gallery_urls: this.galleryInput.split(',').map(value => value.trim()).filter(Boolean),
      location: 'Partner-managed location',
      max_guests: 2,
      beds: 1,
      bathrooms: 1,
      city: 'Chennai',
      country: 'India',
    }).subscribe(() => {
      this.loadRooms();
      this.amenityInput = '';
      this.galleryInput = '';
    });
  }

  private loadRooms() {
    this.partnerService.getRooms().subscribe(response => {
      this.rooms.set(response.rooms);
      this.total.set(response.total);
    });
  }
}
