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
        <button type="submit">Save settings</button>
      </form>
    </section>
  `,
  styles: [`
    header p { color: var(--pp-text-muted); margin-top: 6px; }
    .settings__form {
      display: grid;
      gap: 12px;
      margin-top: 16px;
      border-radius: 20px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      padding: 18px;
    }
    .settings__form input,
    .settings__form textarea,
    .settings__form button {
      width: 100%;
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface-2);
      color: var(--pp-text);
    }
    .settings__form button {
      border: none;
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
      color: #111827;
      font-weight: 700;
    }
  `],
})
export class SettingsComponent {
  private partnerService = inject(PartnerService);
  private hydrated = signal(false);

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
      this.hydrated.set(true);
    });
  }

  save() {
    this.partnerService.updateHotel(this.draft).subscribe();
  }
}
