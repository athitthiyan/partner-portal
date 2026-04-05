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
        <div class="sidebar__logo">SV</div>
        @if (!collapsed()) {
          <div class="sidebar__title">
            <strong>Partner Portal</strong>
            <span>Stayvora</span>
          </div>
        }
        <button class="sidebar__toggle sidebar__toggle--desktop" type="button" (click)="toggleCollapsed()">
          {{ collapsed() ? '>' : '<' }}
        </button>
        <button class="sidebar__toggle sidebar__toggle--mobile" type="button" (click)="requestClose.emit()">X</button>
      </div>

      <nav class="sidebar__nav">
        @for (item of items; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            class="sidebar__link"
            (click)="requestClose.emit()"
          >
            <span class="sidebar__icon">{{ item.icon }}</span>
            @if (!collapsed()) { <span>{{ item.label }}</span> }
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: min(86vw, 320px);
      min-height: 100dvh;
      background: #0d1627;
      border-right: 1px solid var(--pp-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      inset: 0 auto 0 0;
      transform: translateX(-100%);
      transition: transform 0.25s ease, width 0.25s ease;
      z-index: 140;
    }

    .sidebar--mobile-open {
      transform: translateX(0);
    }

    .sidebar--collapsed {
      width: 76px;
    }

    .sidebar__head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 14px;
      border-bottom: 1px solid var(--pp-border);
    }

    .sidebar__logo {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-2));
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
    }

    .sidebar__title span {
      display: block;
      color: var(--pp-text-muted);
      font-size: 0.8rem;
    }

    .sidebar__toggle {
      border: 1px solid var(--pp-border);
      background: var(--pp-surface);
      color: var(--pp-text);
      width: 30px;
      height: 30px;
      border-radius: 8px;
    }

    .sidebar__toggle--desktop {
      display: none;
    }

    .sidebar__nav {
      padding: 12px 8px;
      overflow-y: auto;
      display: grid;
      gap: 4px;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      color: var(--pp-text-muted);
    }

    .sidebar__link.active {
      background: rgba(228, 200, 103, 0.14);
      border: 1px solid rgba(228, 200, 103, 0.22);
      color: var(--pp-primary-2);
    }

    .sidebar__icon {
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    @media (min-width: 769px) {
      .sidebar {
        position: sticky;
        transform: none;
        width: var(--sidebar-width);
      }

      .sidebar__toggle--desktop {
        display: inline-flex;
      }

      .sidebar__toggle--mobile {
        display: none;
      }
    }
  `],
})
export class SidebarComponent {
  @Input() mobileOpen = false;
  @Output() requestClose = new EventEmitter<void>();

  collapsed = signal(false);

  readonly items = [
    { icon: 'OV', label: 'Overview', route: '/' },
    { icon: 'RM', label: 'Rooms', route: '/rooms' },
    { icon: 'BK', label: 'Bookings', route: '/bookings' },
    { icon: 'CL', label: 'Calendar', route: '/calendar' },
    { icon: 'PO', label: 'Payouts', route: '/payouts' },
    { icon: 'ST', label: 'Settings', route: '/settings' },
  ];

  toggleCollapsed() {
    this.collapsed.update(value => !value);
  }
}
