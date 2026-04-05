import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, PartnerRegisterPayload, PartnerUser } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'partner_portal_access_token';
const REFRESH_TOKEN_KEY = 'partner_portal_refresh_token';
const AUTH_USER_KEY = 'partner_portal_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private accessTokenState = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private refreshTokenState = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private userState = signal<PartnerUser | null>(this.readStoredUser());

  readonly accessToken = computed(() => this.accessTokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => !!this.accessTokenState() && !!this.userState());
  readonly isPartner = computed(() => this.userState()?.is_partner === true);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/partner/login`, { email, password }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  register(payload: PartnerRegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/partner/register`, payload).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  restoreSession(): Observable<PartnerUser> | null {
    if (!this.accessTokenState()) {
      return null;
    }
    return this.http.get<PartnerUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        if (!user.is_partner) {
          this.logout(false);
          return;
        }
        this.userState.set(user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      })
    );
  }

  logout(redirect = true) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
    this.userState.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  private applyAuth(response: AuthResponse) {
    this.accessTokenState.set(response.access_token);
    this.refreshTokenState.set(response.refresh_token);
    this.userState.set(response.user);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
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
