import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <p class="auth-card__eyebrow">Stayvora Partner Portal</p>
        <h1>Partner sign in</h1>
        <p class="auth-card__copy">Manage rates, occupancy, payouts, and live bookings from one mobile-ready workspace.</p>

        <form class="auth-form" (ngSubmit)="login()">
          <input type="email" name="email" [(ngModel)]="email" placeholder="partner@example.com" [disabled]="loading()" required />
          <input type="password" name="password" [(ngModel)]="password" placeholder="Password" [disabled]="loading()" required />
          @if (error()) { <div class="auth-error">{{ error() }}</div> }
          <button type="submit" [disabled]="loading()">{{ loading() ? 'Signing in...' : 'Continue to partner hub' }}</button>
        </form>

        <a routerLink="/register" class="auth-link">Need an onboarding account? Register your hotel.</a>
      </div>
    </section>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 20px;
      background:
        radial-gradient(circle at top left, rgba(228, 200, 103, 0.14), transparent 28%),
        radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.16), transparent 32%),
        linear-gradient(160deg, #07101c, #0d1627 55%, #09111f);
    }

    .auth-card {
      width: min(100%, 460px);
      background: rgba(12, 19, 33, 0.92);
      border: 1px solid var(--pp-border);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 30px 80px rgba(2, 6, 23, 0.42);
    }

    .auth-card__eyebrow {
      color: var(--pp-primary);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.76rem;
      margin-bottom: 12px;
      font-weight: 700;
    }

    .auth-card h1 {
      margin-bottom: 10px;
      font-size: 2rem;
    }

    .auth-card__copy,
    .auth-link {
      color: var(--pp-text-muted);
    }

    .auth-form {
      display: grid;
      gap: 14px;
      margin: 24px 0 18px;
    }

    .auth-form input,
    .auth-form button {
      width: 100%;
      border-radius: 14px;
      padding: 14px 16px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      color: var(--pp-text);
    }

    .auth-form button {
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
      color: #111827;
      font-weight: 700;
      border: none;
    }

    .auth-error {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(239, 68, 68, 0.14);
      border: 1px solid rgba(239, 68, 68, 0.18);
      color: #fecaca;
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  login() {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: response => {
        if (!response.user.is_partner) {
          this.auth.logout(false);
          this.error.set('This account does not have partner access.');
          this.loading.set(false);
          return;
        }
        this.router.navigate(['/']);
      },
      error: err => {
        this.error.set(err?.error?.detail || 'Unable to sign in right now.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
