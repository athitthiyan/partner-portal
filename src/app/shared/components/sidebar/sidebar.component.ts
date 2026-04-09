import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.sidebar--mobile-open]="mobileOpen" [class.sidebar--collapsed]="collapsed()">
      <div class="sidebar__head">
        <div class="sidebar__logo"><svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="32" height="32" rx="8" fill="#0f2033"/><path d="M9 20C9 15 13 12 18 12C23 12 21 15.5 16.5 17C12 18.5 10.5 21.5 15 23C19.5 24.5 23 22 23 19.5" stroke="#d6b86b" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg></div>
        @if (!collapsed()) {
          <div class="sidebar__title">
            <strong>Partner Hub</strong>
            <span>Stayvora</span>
          </div>
        }
        <button class="sidebar__toggle sidebar__toggle--desktop" type="button" (click)="toggleCollapsed()" [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          {{ collapsed() ? '\u203A' : '\u2039' }}
        </button>
        <button class="sidebar__toggle sidebar__toggle--mobile" type="button" (click)="requestClose.emit()" aria-label="Close navigation">\u2715</button>
      </div>

      <nav class="sidebar__nav">
        @for (item of items; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            class="sidebar__link"
            (click)="requestClose.emit()"
            [attr.title]="collapsed() ? item.label : null"
          >
            <span class="sidebar__icon">{{ item.icon }}</span>
            @if (!collapsed()) { <span class="sidebar__label">{{ item.label }}</span> }
          </a>
        }
      </nav>

      <div class="sidebar__bottom">
        @if (!collapsed()) {
          <span class="sidebar__version">v1.0</span>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: min(86vw, 320px);
      min-height: 100dvh;
      background: var(--sv-bg-2, #0d1321);
      border-right: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      display: flex;
      flex-direction: column;
      position: fixed;
      inset: 0 auto 0 0;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 140;
      overflow: hidden;
    }

    .sidebar--mobile-open {
      transform: translateX(0);
    }

    .sidebar--collapsed {
      width: 80px;
    }

    .sidebar__head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 14px;
      border-bottom: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      min-height: 72px;
    }

    .sidebar__logo {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--sv-gradient-gold);
      color: #0f172a;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sidebar__title {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
    }

    .sidebar__title span {
      display: block;
      color: var(--sv-text-muted);
      font-size: 0.8rem;
    }

    .sidebar__toggle {
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      background: var(--sv-surface, rgba(17,25,40,0.8));
      color: var(--sv-text, #f0f4ff);
      width: 30px;
      height: 30px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: background 0.15s ease, border-color 0.15s ease;
      flex-shrink: 0;
    }

    .sidebar__toggle:hover {
      border-color: rgba(214, 184, 107, 0.4);
      background: rgba(214, 184, 107, 0.1);
    }

    .sidebar__toggle--desktop {
      display: none;
    }

    .sidebar__toggle--mobile {
      margin-left: auto;
    }

    .sidebar__nav {
      padding: 12px 8px;
      overflow-y: auto;
      display: grid;
      gap: 4px;
      flex: 1;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      color: var(--sv-text-muted, #8a9bbf);
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease;
      border: 1px solid transparent;
    }

    .sidebar__link:hover {
      background: rgba(255, 255, 255, 0.04);
      color: var(--sv-text, #f0f4ff);
    }

    .sidebar__link.active {
      background: rgba(214, 184, 107, 0.12);
      border-color: rgba(214, 184, 107, 0.2);
      color: var(--sv-gold-light, #f0d58f);
    }

    .sidebar__icon {
      width: 24px;
      text-align: center;
      flex-shrink: 0;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .sidebar__label {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar__bottom {
      padding: 12px 14px;
      border-top: 1px solid var(--sv-border, rgba(255,255,255,0.08));
    }

    .sidebar__version {
      font-size: 0.7rem;
      color: var(--sv-text-muted, #8a9bbf);
      opacity: 0.5;
    }

    @media (min-width: 768px) {
      .sidebar {
        width: var(--sidebar-width, 280px);
        position: sticky;
        top: 0;
        transform: none;
      }

      .sidebar--collapsed {
        width: 80px;
      }

      .sidebar__toggle--desktop {
        display: inline-flex;
        margin-left: auto;
      }

      .sidebar__toggle--mobile {
        display: none;
      }
    }

    /* Mobile default width is handled by base sidebar styles */
  `],
})
export class SidebarComponent {
  @Input() mobileOpen = false;
  @Output() requestClose = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  collapsed = signal(false);

  readonly items = [
    { icon: '\u2302', label: 'Overview', route: '/' },
    { icon: '\u2616', label: 'Rooms', route: '/rooms' },
    { icon: '\u2611', label: 'Bookings', route: '/bookings' },
    { icon: '\u2637', label: 'Calendar', route: '/calendar' },
    { icon: '\u20B9', label: 'Payouts', route: '/payouts' },
    { icon: '\u2699', label: 'Settings', route: '/settings' },
  ];

  toggleCollapsed() {
    this.collapsed.update(value => !value);
    this.collapsedChange.emit(this.collapsed());
  }
}
