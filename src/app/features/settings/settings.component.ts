import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../core/services/partner.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="settings">
      <header>
        <h2>Hotel settings</h2>
        <p>Manage GST data, bank details, customer support contact, and trust settings.</p>
      </header>

      @if (!editMode()) {
        <!-- Read-only view (locked after onboarding) -->
        <div class="settings__card">
          <div class="settings__row">
            <span class="settings__label">Display name</span>
            <span class="settings__value">{{ draft.display_name || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__label">Support email</span>
            <span class="settings__value">{{ draft.support_email || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__label">Support phone</span>
            <span class="settings__value">{{ draft.support_phone || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__label">GST number</span>
            <span class="settings__value">{{ draft.gst_number || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__label">Bank account</span>
            <span class="settings__value">{{ draft.bank_account_name || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__label">IFSC</span>
            <span class="settings__value">{{ draft.bank_ifsc || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__label">UPI ID</span>
            <span class="settings__value">{{ draft.bank_upi_id || '—' }}</span>
          </div>
          <div class="settings__row settings__row--full">
            <span class="settings__label">Description</span>
            <span class="settings__value">{{ draft.description || '—' }}</span>
          </div>

          <div class="settings__lock-actions">
            <button type="button" class="settings__edit-btn" (click)="editMode.set(true)">Edit settings</button>
            <button type="button" class="settings__request-btn" (click)="requestChange()">Request change via support</button>
          </div>

          @if (changeRequested()) {
            <div class="settings__notice">
              Your change request has been submitted. Our team will review and update the settings within 24 hours.
            </div>
          }
        </div>
      } @else {
        <!-- Edit mode -->
        <form class="settings__form" (ngSubmit)="save()">
          <input name="display_name" [(ngModel)]="draft.display_name" placeholder="Hotel display name" />
          <input name="support_email" [(ngModel)]="draft.support_email" placeholder="Support email" />
          <input name="support_phone" [(ngModel)]="draft.support_phone" placeholder="Support phone" />
          <input name="gst_number" [(ngModel)]="draft.gst_number" placeholder="GST number" />
          <input name="bank_account_name" [(ngModel)]="draft.bank_account_name" placeholder="Bank account name" />
          <input name="bank_account_number" [(ngModel)]="draft.bank_account_number" placeholder="New bank account number" />
          <input name="bank_ifsc" [(ngModel)]="draft.bank_ifsc" placeholder="IFSC" />
          <input name="bank_upi_id" [(ngModel)]="draft.bank_upi_id" placeholder="UPI payout ID" />
          <textarea name="description" [(ngModel)]="draft.description" placeholder="Hotel description"></textarea>
          <div class="settings__form-actions">
            <button type="submit">Save settings</button>
            <button type="button" class="settings__cancel-btn" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [`
    header p { color: var(--sv-text-muted); margin-top: 6px; }
    .settings__card {
      margin-top: 16px;
      border-radius: 20px;
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      background: var(--sv-surface, rgba(17,25,40,0.8));
      padding: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .settings__row {
      display: grid;
      gap: 4px;
    }
    .settings__row--full {
      grid-column: 1 / -1;
    }
    .settings__label {
      font-size: 0.78rem;
      color: var(--sv-text-muted, #8a9bbf);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .settings__value {
      color: var(--sv-text, #f0f4ff);
      font-size: 0.95rem;
    }
    .settings__lock-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid var(--sv-border, rgba(255,255,255,0.08));
    }
    .settings__edit-btn {
      padding: 10px 24px;
      border-radius: 12px;
      border: none;
      background: var(--sv-gradient-gold, linear-gradient(135deg, #d4af37, #f0d58f));
      color: #111827;
      font-weight: 700;
      cursor: pointer;
    }
    .settings__request-btn {
      padding: 10px 24px;
      border-radius: 12px;
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      background: transparent;
      color: var(--sv-text, #f0f4ff);
      cursor: pointer;
    }
    .settings__request-btn:hover {
      border-color: rgba(214, 184, 107, 0.4);
    }
    .settings__notice {
      grid-column: 1 / -1;
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #86efac;
      font-size: 0.88rem;
    }
    .settings__form {
      display: grid;
      gap: 12px;
      margin-top: 16px;
      border-radius: 20px;
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      background: var(--sv-surface, rgba(17,25,40,0.8));
      padding: 18px;
    }
    .settings__form input,
    .settings__form textarea {
      width: 100%;
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      background: var(--sv-surface-2, rgba(15,20,35,0.6));
      color: var(--sv-text, #f0f4ff);
    }
    .settings__form-actions {
      display: flex;
      gap: 12px;
    }
    .settings__form-actions button {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .settings__form-actions button[type="submit"] {
      border: none;
      background: var(--sv-gradient-gold, linear-gradient(135deg, #d4af37, #f0d58f));
      color: #111827;
    }
    .settings__cancel-btn {
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      background: transparent;
      color: var(--sv-text, #f0f4ff);
    }
    @media (max-width: 600px) {
      .settings__card {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class SettingsComponent {
  private partnerService = inject(PartnerService);
  private hydrated = signal(false);

  editMode = signal(false);
  changeRequested = signal(false);
  private originalDraft: typeof this.draft | null = null;

  draft = {
    display_name: '',
    support_email: '',
    support_phone: '',
    gst_number: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_upi_id: '',
    description: '',
  };

  constructor() {
    this.partnerService.getHotel().subscribe(hotel => {
      if (this.hydrated()) {
        return;
      }
      this.draft = {
        display_name: hotel.display_name,
        support_email: hotel.support_email,
        support_phone: hotel.support_phone || '',
        gst_number: hotel.gst_number || '',
        bank_account_name: hotel.bank_account_name || '',
        bank_account_number: '',
        bank_ifsc: hotel.bank_ifsc || '',
        bank_upi_id: hotel.bank_upi_id || '',
        description: hotel.description || '',
      };
      this.originalDraft = { ...this.draft };
      this.hydrated.set(true);
    });
  }

  save() {
    this.partnerService.updateHotel(this.draft).subscribe(() => {
      this.originalDraft = { ...this.draft };
      this.editMode.set(false);
    });
  }

  cancelEdit() {
    if (this.originalDraft) {
      this.draft = { ...this.originalDraft };
    }
    this.editMode.set(false);
  }

  requestChange() {
    this.partnerService.updateHotel({ change_request: true } as never).subscribe({
      next: () => this.changeRequested.set(true),
      error: () => this.changeRequested.set(true),
    });
  }
}
