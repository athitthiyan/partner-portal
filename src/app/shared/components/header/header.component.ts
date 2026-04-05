import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="partner-header">
      <div class="partner-header__brand">
        <button class="partner-header__menu" type="button" (click)="menuToggle.emit()" aria-label="Open navigation">|||</button>
        <div>
          <h1>Stayvora Partner Hub</h1>
          <p>Stay Better. Travel Smarter. Operate inventory, bookings, payouts, and hotel trust in one place.</p>
        </div>
      </div>

      <div class="partner-header__actions">
        <a class="partner-header__launch" href="https://stayvora.co.in/" target="_blank" rel="noreferrer">
          View customer app
        </a>
        <div class="partner-header__user">
          <span class="partner-header__avatar">{{ initials() }}</span>
          <div>
            <strong>{{ displayName() }}</strong>
            <span>Hotel partner</span>
          </div>
        </div>
        <button class="partner-header__logout" type="button" (click)="logout()">Logout</button>
      </div>
    </header>
  `,
  styles: [`
    .partner-header {
      position: sticky;
      top: 0;
      z-index: 40;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      padding: 16px;
      background: rgba(9, 16, 28, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--pp-border);
      flex-wrap: wrap;
    }

    .partner-header__brand {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .partner-header__menu,
    .partner-header__logout,
    .partner-header__launch {
      border-radius: 12px;
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      color: var(--pp-text);
      padding: 10px 14px;
    }

    .partner-header__menu {
      width: 42px;
      height: 42px;
      padding: 0;
    }

    .partner-header__brand h1 {
      font-size: 1.1rem;
      margin-bottom: 4px;
    }

    .partner-header__brand p {
      color: var(--pp-text-muted);
      font-size: 0.9rem;
      max-width: 620px;
    }

    .partner-header__actions {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      justify-content: space-between;
    }

    .partner-header__user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      border-radius: 14px;
      background: var(--pp-surface);
      border: 1px solid var(--pp-border);
    }

    .partner-header__avatar {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .partner-header__user div span {
      display: block;
      color: var(--pp-text-muted);
      font-size: 0.8rem;
    }

    @media (max-width: 768px) {
      .partner-header__brand p,
      .partner-header__launch {
        display: none;
      }
    }

    @media (min-width: 769px) {
      .partner-header {
        padding: 18px 28px;
        flex-wrap: nowrap;
      }

      .partner-header__menu {
        display: none;
      }

      .partner-header__actions {
        width: auto;
        justify-content: flex-end;
      }
    }
  `],
})
export class HeaderComponent {
  private auth = inject(AuthService);

  @Output() menuToggle = new EventEmitter<void>();

  displayName = computed(() => this.auth.user()?.full_name || 'Partner');
  initials = computed(() =>
    (this.auth.user()?.full_name || 'Partner')
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );

  logout() {
    this.auth.logout();
  }
}
