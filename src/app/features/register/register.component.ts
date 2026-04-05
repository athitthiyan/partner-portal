import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="register-page">
      <div class="register-card">
        <h1>List your hotel on StayEase</h1>
        <p>Complete this first onboarding step to create your hotel partner workspace.</p>

        <form class="register-form" (ngSubmit)="register()">
          <div class="register-form__grid">
            <input name="full_name" [(ngModel)]="form.full_name" placeholder="Owner full name" required />
            <input name="email" [(ngModel)]="form.email" type="email" placeholder="Login email" required />
            <input name="password" [(ngModel)]="form.password" type="password" placeholder="Strong password" required />
            <input name="legal_name" [(ngModel)]="form.legal_name" placeholder="Legal business name" required />
            <input name="display_name" [(ngModel)]="form.display_name" placeholder="Hotel display name" required />
            <input name="support_email" [(ngModel)]="form.support_email" type="email" placeholder="Support email" required />
            <input name="support_phone" [(ngModel)]="form.support_phone" placeholder="Support phone" required />
            <input name="gst_number" [(ngModel)]="form.gst_number" placeholder="GST number" />
            <input name="address_line" [(ngModel)]="form.address_line" placeholder="Address line" required />
            <input name="city" [(ngModel)]="form.city" placeholder="City" required />
            <input name="state" [(ngModel)]="form.state" placeholder="State" />
            <input name="postal_code" [(ngModel)]="form.postal_code" placeholder="Postal code" />
            <input name="bank_account_name" [(ngModel)]="form.bank_account_name" placeholder="Bank account name" />
            <input name="bank_account_number" [(ngModel)]="form.bank_account_number" placeholder="Bank account number" />
            <input name="bank_ifsc" [(ngModel)]="form.bank_ifsc" placeholder="IFSC code" />
            <input name="bank_upi_id" [(ngModel)]="form.bank_upi_id" placeholder="UPI payout ID" />
          </div>
          @if (error()) { <div class="register-error">{{ error() }}</div> }
          <button type="submit" [disabled]="loading()">{{ loading() ? 'Creating partner workspace...' : 'Create partner account' }}</button>
        </form>
        <a routerLink="/login" class="register-link">Already onboarded? Sign in.</a>
      </div>
    </section>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(180deg, #07101c, #0d1627);
    }

    .register-card {
      max-width: 960px;
      margin: 0 auto;
      padding: 28px;
      background: rgba(12, 19, 33, 0.94);
      border: 1px solid var(--pp-border);
      border-radius: 24px;
    }

    .register-card p,
    .register-link {
      color: var(--pp-text-muted);
    }

    .register-form {
      display: grid;
      gap: 16px;
      margin-top: 20px;
    }

    .register-form__grid {
      display: grid;
      gap: 12px;
    }

    .register-form input,
    .register-form button {
      width: 100%;
      border-radius: 14px;
      padding: 14px 16px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      color: var(--pp-text);
    }

    .register-form button {
      border: none;
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
      color: #111827;
      font-weight: 700;
    }

    .register-error {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(239, 68, 68, 0.14);
      border: 1px solid rgba(239, 68, 68, 0.18);
      color: #fecaca;
    }

    @media (min-width: 768px) {
      .register-page {
        padding: 40px;
      }

      .register-form__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');
  form = {
    email: '',
    full_name: '',
    password: '',
    legal_name: '',
    display_name: '',
    support_email: '',
    support_phone: '',
    address_line: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    gst_number: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_upi_id: '',
  };

  register() {
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => {
        this.error.set(err?.error?.detail || 'Unable to create partner account right now.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
