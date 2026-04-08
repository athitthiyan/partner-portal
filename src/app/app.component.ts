import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    @if (showShell()) {
      <div class="partner-layout">
        <button
          type="button"
          class="partner-layout__overlay"
          [class.partner-layout__overlay--visible]="sidebarOpen()"
          (click)="closeSidebar()"
          aria-label="Close partner navigation"
        ></button>

        <app-sidebar [mobileOpen]="sidebarOpen()" (requestClose)="closeSidebar()" />

        <div class="partner-layout__main">
          <app-header (menuToggle)="toggleSidebar()" />
          <main class="partner-layout__content">
            <router-outlet />
          </main>
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .partner-layout {
      min-height: 100vh;
      display: flex;
      position: relative;
      background: var(--sv-bg);
    }

    .partner-layout__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .partner-layout__content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .partner-layout__overlay {
      position: fixed;
      inset: 0;
      border: 0;
      background: rgba(2, 6, 23, 0.76);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 139;
    }

    .partner-layout__overlay--visible {
      opacity: 1;
      pointer-events: auto;
    }

    @media (min-width: 769px) {
      .partner-layout__content {
        padding: 28px;
      }

      .partner-layout__overlay {
        display: none;
      }
    }
  `],
})
export class AppComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private currentUrl = signal(this.router.url);

  sidebarOpen = signal(false);
  showShell = computed(() => !['/login', '/register'].includes(this.currentUrl()) && this.auth.isAuthenticated());

  constructor() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.currentUrl.set(this.router.url);
      this.closeSidebar();
    });

    this.auth.restoreSession()?.subscribe({
      error: () => this.auth.logout(false),
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update(value => !value);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
