import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, PartnerRegisterPayload, PartnerUser } from '../models/auth.model';

// Access token in memory only; refresh token in HttpOnly cookie (set by backend)
const AUTH_USER_KEY = 'partner_portal_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Access token in memory only (not persisted)
  private accessTokenState = signal<string | null>(null);
  private userState = signal<PartnerUser | null>(this.readStoredUser());

  readonly accessToken = computed(() => this.accessTokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => !!this.accessTokenState() && !!this.userState());
  readonly isPartner = computed(() => this.userState()?.is_partner === true);

  /**
   * Public getter for access token used by services like PlatformSyncService
   * Returns the current access token or null if not authenticated
   */
  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/partner/login`, { email, password }, { withCredentials: true }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  refreshToken$(): Observable<AuthResponse> {
    // Refresh token is sent automatically via HttpOnly cookie
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  register(payload: PartnerRegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/partner/register`, payload, { withCredentials: true }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  /**
   * Restore session on app init by calling /auth/refresh.
   * HttpOnly cookie is sent automatically. Returns true if restored.
   */
  restoreSession(): Observable<boolean> {
    if (!this.readStoredUser()) {
      return of(false);
    }
    return this.refreshToken$().pipe(
      map(res => {
        if (!res.user || !(res.user as unknown as PartnerUser).is_partner) {
          this.logout(false);
          return false;
        }
        return true;
      }),
      catchError(() => {
        localStorage.removeItem(AUTH_USER_KEY);
        this.accessTokenState.set(null);
        this.userState.set(null);
        return of(false);
      }),
    );
  }

  logout(redirect = true) {
    // Revoke refresh token server-side (cookie sent automatically)
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe();
    localStorage.removeItem(AUTH_USER_KEY);
    this.accessTokenState.set(null);
    this.userState.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  private applyAuth(response: AuthResponse) {
    this.accessTokenState.set(response.access_token);
    this.userState.set(response.user);
    // Only cache user profile (non-sensitive) in localStorage
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  }

  private readStoredUser(): PartnerUser | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as PartnerUser;
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  }
}
