import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface GeocodeBackendResponse {
  found: boolean;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
}

interface LeafletMarkerLike {
  addTo(map: LeafletMapLike): LeafletMarkerLike;
  on(event: 'dragend', handler: () => void): void;
  getLatLng(): { lat: number; lng: number };
}

interface LeafletMapLike {
  invalidateSize(): void;
  remove(): void;
}

interface LeafletLike {
  map(element: HTMLDivElement, options: {
    center: [number, number];
    zoom: number;
    zoomControl: boolean;
    attributionControl: boolean;
  }): LeafletMapLike;
  tileLayer(url: string, options: { maxZoom: number; subdomains: string }): { addTo(map: LeafletMapLike): void };
  marker(coords: [number, number], options: { draggable: boolean }): LeafletMarkerLike;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="register-page">
      <div class="register-card">
        <div class="register-header">
          <h1>List your hotel on <span class="brand-gold">Stayvora</span></h1>
          <p>Complete onboarding to create your partner workspace.</p>
          <div class="step-indicator">
            <div class="step" [class.step--active]="currentStep() === 1" [class.step--done]="currentStep() > 1">
              <span class="step__num">1</span><span class="step__label">Business Info</span>
            </div>
            <div class="step__line" [class.step__line--done]="currentStep() > 1"></div>
            <div class="step" [class.step--active]="currentStep() === 2" [class.step--done]="currentStep() > 2">
              <span class="step__num">2</span><span class="step__label">Location</span>
            </div>
            <div class="step__line" [class.step__line--done]="currentStep() > 2"></div>
            <div class="step" [class.step--active]="currentStep() === 3">
              <span class="step__num">3</span><span class="step__label">Payout</span>
            </div>
          </div>
        </div>

        <form class="register-form" (ngSubmit)="handleSubmit()">

          <!-- ═══ STEP 1: Business Info ═══ -->
          @if (currentStep() === 1) {
            <div class="form-section">
              <h2 class="section-title">Business Details</h2>
              <div class="register-form__grid">
                <div class="form-group">
                  <label for="full_name">Owner Full Name</label>
                  <input id="full_name" name="full_name" [(ngModel)]="form.full_name" placeholder="Your full name" required />
                </div>
                <div class="form-group">
                  <label for="email">Login Email</label>
                  <input id="email" name="email" [(ngModel)]="form.email" type="email" placeholder="you@hotel.com" required />
                </div>
                <div class="form-group">
                  <label for="password">Password</label>
                  <input id="password" name="password" [(ngModel)]="form.password" type="password" placeholder="Min 10 chars, uppercase + number" required />
                </div>
                <div class="form-group">
                  <label for="legal_name">Legal Business Name</label>
                  <input id="legal_name" name="legal_name" [(ngModel)]="form.legal_name" placeholder="Business registration name" required />
                </div>
                <div class="form-group">
                  <label for="display_name">Hotel Display Name</label>
                  <input id="display_name" name="display_name" [(ngModel)]="form.display_name" placeholder="Guests will see this name" required />
                </div>
                <div class="form-group">
                  <label for="support_email">Support Email</label>
                  <input id="support_email" name="support_email" [(ngModel)]="form.support_email" type="email" placeholder="support@hotel.com" required />
                </div>
                <div class="form-group">
                  <label for="support_phone">Support Phone</label>
                  <input id="support_phone" name="support_phone" [(ngModel)]="form.support_phone" placeholder="+91 98765 43210" required />
                </div>
                <div class="form-group">
                  <label for="gst_number">GST Number <span class="optional">(optional)</span></label>
                  <input id="gst_number" name="gst_number" [(ngModel)]="form.gst_number" placeholder="33ABCDE1234F1Z5" />
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn--primary" (click)="nextStep()" [disabled]="!isStep1Valid()">
                  Continue to Location
                </button>
              </div>
            </div>
          }

          <!-- ═══ STEP 2: Location with Geocoding ═══ -->
          @if (currentStep() === 2) {
            <div class="form-section">
              <h2 class="section-title">Hotel Location</h2>
              <p class="section-desc">Enter your hotel address and validate the location. Coordinates are required for guests to find you on the map.</p>

              <div class="register-form__grid">
                <div class="form-group form-group--full">
                  <label for="address_line">Address Line 1</label>
                  <input id="address_line" name="address_line" [(ngModel)]="form.address_line" placeholder="Street address" required />
                </div>
                <div class="form-group form-group--full">
                  <label for="address_line_2">Address Line 2 <span class="optional">(optional)</span></label>
                  <input id="address_line_2" name="address_line_2" [(ngModel)]="form.address_line_2" placeholder="Apartment, suite, floor" />
                </div>
                <div class="form-group">
                  <label for="country">Country</label>
                  <select id="country" name="country" [(ngModel)]="form.country" (ngModelChange)="onCountryChange()" required>
                    <option value="" disabled>Select country</option>
                    @for (c of countries; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="state">State / Province</label>
                  <select id="state" name="state" [(ngModel)]="form.state" (ngModelChange)="onStateChange()" [disabled]="!availableStates().length">
                    <option value="">{{ availableStates().length ? 'Select state' : 'Select country first' }}</option>
                    @for (s of availableStates(); track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="city">City</label>
                  <select id="city" name="city" [(ngModel)]="form.city" [disabled]="!availableCities().length" required>
                    <option value="">{{ availableCities().length ? 'Select city' : 'Select state first' }}</option>
                    @for (ct of availableCities(); track ct) {
                      <option [value]="ct">{{ ct }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="postal_code">Postal Code</label>
                  <input id="postal_code" name="postal_code" [(ngModel)]="form.postal_code" placeholder="600001" />
                </div>
                <div class="form-group">
                  <label for="support_phone_code">Phone Code</label>
                  <select id="support_phone_code" name="support_phone_code" [(ngModel)]="phoneCode">
                    <option value="+91">+91 (India)</option>
                    <option value="+1">+1 (US/Canada)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (Australia)</option>
                    <option value="+65">+65 (Singapore)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+81">+81 (Japan)</option>
                  </select>
                </div>
              </div>

              <!-- Validate Location Button -->
              <button
                type="button"
                class="btn btn--gold btn--validate"
                (click)="validateLocation()"
                [disabled]="geocoding() || !isAddressValid()"
              >
                @if (geocoding()) {
                  <span class="spinner"></span> Validating location...
                } @else {
                  <span class="btn-icon">📍</span> Validate Location
                }
              </button>

              @if (geocodeError()) {
                <div class="geo-error">{{ geocodeError() }}</div>
              }

              <!-- Map Preview (shown after geocoding) -->
              @if (locationValidated()) {
                <div class="location-preview">
                  <div class="location-preview__header">
                    <div class="location-preview__badge">
                      <span class="badge--verified">✓ Location Verified</span>
                    </div>
                    <p class="location-preview__address">{{ form.formatted_address }}</p>
                  </div>

                  <div class="location-preview__map" id="previewMap">
                    <div class="map-placeholder">
                      <div class="map-pin">
                        <div class="map-pin__marker">📍</div>
                        <div class="map-pin__label">{{ form.display_name || 'Your Hotel' }}</div>
                      </div>
                      <div class="map-coords">
                        <span>Lat: {{ form.latitude?.toFixed(6) }}</span>
                        <span>Lng: {{ form.longitude?.toFixed(6) }}</span>
                      </div>
                      <p class="map-hint">Pin location confirmed. You can fine-tune it after registration in Settings.</p>
                    </div>
                  </div>

                  <div class="location-preview__actions">
                    <button type="button" class="btn btn--ghost btn--sm" (click)="resetLocation()">
                      Re-validate Address
                    </button>
                  </div>

                  <!-- Mini Map Preview with Draggable Pin -->
                  <div class="location-map" #locationMap></div>
                </div>
              }

              <div class="form-actions">
                <button type="button" class="btn btn--ghost" (click)="prevStep()">Back</button>
                <button type="button" class="btn btn--primary" (click)="nextStep()" [disabled]="!locationValidated()">
                  Continue to Payout
                </button>
              </div>
            </div>
          }

          <!-- ═══ STEP 3: Payout Info ═══ -->
          @if (currentStep() === 3) {
            <div class="form-section">
              <h2 class="section-title">Payout Information</h2>
              <p class="section-desc">Set up your bank details for receiving payouts. You can update these later in Settings.</p>

              <div class="register-form__grid">
                <div class="form-group">
                  <label for="bank_account_name">Account Holder Name <span class="optional">(optional)</span></label>
                  <input id="bank_account_name" name="bank_account_name" [(ngModel)]="form.bank_account_name" placeholder="Account holder name" />
                </div>
                <div class="form-group">
                  <label for="bank_account_number">Account Number <span class="optional">(optional)</span></label>
                  <input id="bank_account_number" name="bank_account_number" [(ngModel)]="form.bank_account_number" placeholder="Bank account number" />
                </div>
                <div class="form-group">
                  <label for="bank_ifsc">IFSC Code <span class="optional">(optional)</span></label>
                  <input id="bank_ifsc" name="bank_ifsc" [(ngModel)]="form.bank_ifsc" placeholder="HDFC0001234" />
                </div>
                <div class="form-group">
                  <label for="bank_upi_id">UPI Payout ID <span class="optional">(optional)</span></label>
                  <input id="bank_upi_id" name="bank_upi_id" [(ngModel)]="form.bank_upi_id" placeholder="hotel@upi" />
                </div>
              </div>

              @if (error()) { <div class="register-error">{{ error() }}</div> }

              <div class="form-actions">
                <button type="button" class="btn btn--ghost" (click)="prevStep()">Back</button>
                <button type="submit" class="btn btn--primary btn--lg" [disabled]="loading()">
                  {{ loading() ? 'Creating partner workspace...' : 'Create Partner Account' }}
                </button>
              </div>
            </div>
          }
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
      padding: 32px;
      background: rgba(12, 19, 33, 0.94);
      border: 1px solid var(--sv-border);
      border-radius: 24px;
    }

    .register-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .register-header h1 {
      font-size: 1.75rem;
      color: var(--sv-text);
      margin: 0 0 8px;
    }

    .register-header p {
      color: var(--sv-text-muted);
      margin: 0 0 24px;
    }

    .brand-gold { color: var(--sv-gold); }

    /* ── Step Indicator ── */
    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-top: 20px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.4;
      transition: opacity 0.3s;
    }
    .step--active, .step--done { opacity: 1; }

    .step__num {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      font-size: 12px; font-weight: 700;
      background: var(--sv-surface);
      border: 1px solid var(--sv-border);
      color: var(--sv-text-muted);
    }
    .step--active .step__num {
      background: var(--sv-gold);
      border-color: var(--sv-gold);
      color: #111827;
    }
    .step--done .step__num {
      background: #22c55e;
      border-color: #22c55e;
      color: #fff;
    }

    .step__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--sv-text-muted);
    }
    .step--active .step__label { color: var(--sv-text); }

    .step__line {
      width: 48px; height: 2px;
      background: var(--sv-border);
      margin: 0 12px;
      transition: background 0.3s;
    }
    .step__line--done { background: #22c55e; }

    /* ── Form ── */
    .form-section { animation: fadeIn 0.3s ease; }

    .section-title {
      font-size: 1.1rem;
      color: var(--sv-text);
      margin: 0 0 4px;
    }

    .section-desc {
      font-size: 0.85rem;
      color: var(--sv-text-muted);
      margin: 0 0 20px;
    }

    .register-form {
      display: grid;
      gap: 20px;
      margin-top: 8px;
    }

    .register-form__grid {
      display: grid;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group--full { grid-column: 1 / -1; }

    .form-group label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--sv-text-muted);
    }

    .optional {
      text-transform: none;
      font-weight: 400;
      color: var(--sv-text-subtle, #5a6d8a);
    }

    .register-form select {
      width: 100%;
      border-radius: 14px;
      padding: 13px 16px;
      border: 1px solid var(--sv-border);
      background: var(--sv-surface);
      color: var(--sv-text);
      font-size: 14px;
      transition: border-color 0.2s;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%238a9bbf' stroke-width='1.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      cursor: pointer;
    }
    .register-form select:focus {
      outline: none;
      border-color: var(--sv-gold);
      box-shadow: 0 0 0 3px rgba(214,184,107,0.15);
    }
    .register-form select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .register-form input,
    .register-form button[type="submit"] {
      width: 100%;
      border-radius: 14px;
      padding: 13px 16px;
      border: 1px solid var(--sv-border);
      background: var(--sv-surface);
      color: var(--sv-text);
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .register-form input:focus {
      outline: none;
      border-color: var(--sv-gold);
      box-shadow: 0 0 0 3px rgba(214,184,107,0.15);
    }

    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn--primary {
      background: var(--sv-gradient-gold);
      color: #111827;
    }
    .btn--primary:hover:not(:disabled) {
      box-shadow: 0 4px 20px rgba(214,184,107,0.3);
    }

    .btn--gold {
      background: linear-gradient(135deg, #d6b86b, #c4a553);
      color: #111827;
    }

    .btn--ghost {
      background: transparent;
      border: 1px solid var(--sv-border);
      color: var(--sv-text);
    }
    .btn--ghost:hover { border-color: var(--sv-gold); color: var(--sv-gold); }

    .btn--sm { padding: 8px 16px; font-size: 13px; }
    .btn--lg { padding: 14px 32px; font-size: 15px; }

    .btn--validate {
      width: 100%;
      padding: 14px 24px;
      font-size: 15px;
      margin-top: 8px;
    }

    .btn-icon { font-size: 18px; }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    /* ── Geocode feedback ── */
    .geo-error {
      padding: 10px 14px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.18);
      color: #fca5a5;
      font-size: 13px;
      margin-top: 8px;
    }

    .register-error {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(239, 68, 68, 0.14);
      border: 1px solid rgba(239, 68, 68, 0.18);
      color: #fecaca;
    }

    /* ── Location Preview ── */
    .location-preview {
      margin-top: 16px;
      border: 1px solid rgba(34,197,94,0.25);
      border-radius: 16px;
      overflow: hidden;
      background: rgba(34,197,94,0.04);
    }

    .location-preview__header {
      padding: 16px 20px;
    }

    .badge--verified {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(34,197,94,0.15);
      color: #4ade80;
      font-size: 12px;
      font-weight: 600;
    }

    .location-preview__address {
      font-size: 13px;
      color: var(--sv-text-muted);
      margin: 8px 0 0;
      line-height: 1.5;
    }

    .location-preview__map {
      height: 200px;
      background: rgba(7,17,25,0.6);
      border-top: 1px solid rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .map-placeholder {
      text-align: center;
      padding: 20px;
    }

    .map-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-bottom: 12px;
    }

    .map-pin__marker { font-size: 32px; }

    .map-pin__label {
      font-size: 13px;
      font-weight: 600;
      color: var(--sv-gold);
      background: rgba(214,184,107,0.12);
      padding: 4px 12px;
      border-radius: 8px;
    }

    .map-coords {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-bottom: 8px;
    }

    .map-coords span {
      font-size: 12px;
      font-family: monospace;
      color: var(--sv-text-muted);
      background: rgba(255,255,255,0.04);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .map-hint {
      font-size: 12px;
      color: var(--sv-text-subtle, #5a6d8a);
      margin: 0;
    }

    .location-preview__actions {
      padding: 12px 20px;
      display: flex;
      justify-content: flex-end;
    }

    .location-map {
      width: 100%;
      height: 200px;
      border-radius: 14px;
      border: 1px solid var(--sv-border);
      margin-top: 12px;
      overflow: hidden;
    }

    .register-link {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: var(--sv-text-muted);
      font-size: 14px;
    }
    .register-link:hover { color: var(--sv-gold); }

    /* ── Spinner ── */
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(17,24,39,0.3);
      border-top-color: #111827;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

    @media (min-width: 768px) {
      .register-page { padding: 40px; }
      .register-card { padding: 40px; }
      .register-form__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    /* Tablet (768–900px): narrower card */
    @media (min-width: 768px) and (max-width: 900px) {
      .register-card { max-width: 560px; padding: 28px; }
      .step-indicator { gap: 8px; }
      .step__label { font-size: .62rem; }
    }

    /* Small mobile */
    @media (max-width: 480px) {
      .register-card { padding: 16px; }
      .register-header h1 { font-size: 1.15rem; }
      .step__label { display: none; }
    }
  `],
})
export class RegisterComponent implements AfterViewChecked {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');
  currentStep = signal(1);
  geocoding = signal(false);
  geocodeError = signal('');
  locationValidated = signal(false);

  @ViewChild('locationMap') locationMapEl?: ElementRef<HTMLDivElement>;

  private locationMap: LeafletMapLike | null = null;
  private locationMarker: LeafletMarkerLike | null = null;
  phoneCode = '+91';

  availableStates = signal<string[]>([]);
  availableCities = signal<string[]>([]);

  readonly countries = ['India', 'United States', 'United Kingdom', 'Australia', 'Singapore', 'UAE', 'Japan'];

  private readonly stateMap: Record<string, string[]> = {
    'India': [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Delhi', 'Chandigarh', 'Puducherry',
    ],
  };

  private readonly cityMap: Record<string, string[]> = {
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli', 'Erode', 'Vellore', 'Ooty', 'Kodaikanal', 'Mahabalipuram'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli', 'Hampi', 'Coorg', 'Udupi', 'Dharwad'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad', 'Nashik', 'Lonavala', 'Mahabaleshwar', 'Alibaug', 'Kolhapur'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Munnar', 'Alleppey', 'Wayanad', 'Kumarakom', 'Kovalam'],
    'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'Dwarka', 'Gurugram', 'Noida'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Calangute', 'Candolim', 'Anjuna', 'Palolem'],
    'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar', 'Mount Abu', 'Ranthambore', 'Bikaner'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Kutch', 'Dwarka', 'Somnath'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Secunderabad'],
    'West Bengal': ['Kolkata', 'Darjeeling', 'Siliguri', 'Howrah', 'Durgapur', 'Shantiniketan', 'Sundarbans'],
    'Uttar Pradesh': ['Lucknow', 'Agra', 'Varanasi', 'Noida', 'Allahabad', 'Mathura', 'Kanpur'],
    'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Kullu', 'Kasauli', 'Dalhousie', 'Spiti'],
    'Uttarakhand': ['Dehradun', 'Mussoorie', 'Rishikesh', 'Haridwar', 'Nainital', 'Jim Corbett', 'Auli'],
    'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati', 'Nellore', 'Rajahmundry', 'Araku Valley'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Khajuraho', 'Orchha'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
    'Bihar': ['Patna', 'Gaya', 'Bodh Gaya', 'Rajgir', 'Nalanda'],
    'Odisha': ['Bhubaneswar', 'Puri', 'Cuttack', 'Konark', 'Gopalpur'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Deoghar', 'Dhanbad'],
    'Assam': ['Guwahati', 'Kaziranga', 'Jorhat', 'Tezpur', 'Majuli'],
    'Sikkim': ['Gangtok', 'Pelling', 'Lachung', 'Namchi'],
    'Meghalaya': ['Shillong', 'Cherrapunji', 'Dawki'],
    'Puducherry': ['Pondicherry', 'Auroville'],
    'Chandigarh': ['Chandigarh'],
    'Chhattisgarh': ['Raipur', 'Bilaspur', 'Jagdalpur'],
    'Manipur': ['Imphal', 'Loktak Lake'],
    'Nagaland': ['Kohima', 'Dimapur'],
    'Mizoram': ['Aizawl'],
    'Tripura': ['Agartala'],
    'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Ziro'],
  };

  onCountryChange(): void {
    this.form.state = '';
    this.form.city = '';
    this.availableCities.set([]);
    const states = this.stateMap[this.form.country] || [];
    this.availableStates.set(states);
  }

  onStateChange(): void {
    this.form.city = '';
    const cities = this.cityMap[this.form.state] || [];
    this.availableCities.set(cities);
  }

  form = {
    email: '',
    full_name: '',
    password: '',
    legal_name: '',
    display_name: '',
    support_email: '',
    support_phone: '',
    address_line: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    gst_number: '',
    latitude: null as number | null,
    longitude: null as number | null,
    formatted_address: '',
    location_verified: false,
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_upi_id: '',
  };

  constructor() {
    // Initialize states for default country (India)
    this.availableStates.set(this.stateMap['India'] || []);
  }

  isStep1Valid(): boolean {
    return !!(
      this.form['full_name'] &&
      this.form['email'] &&
      this.form['password'] &&
      this.form['legal_name'] &&
      this.form['display_name'] &&
      this.form['support_email'] &&
      this.form['support_phone']
    );
  }

  isAddressValid(): boolean {
    return !!(
      this.form['address_line'] &&
      this.form['city'] &&
      this.form['country']
    );
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  /** Geocode the entered address → fetch lat/lng automatically.
   *  Strategy: Try backend first → fallback to Nominatim directly from browser */
  validateLocation(): void {
    this.geocoding.set(true);
    this.geocodeError.set('');
    this.locationValidated.set(false);

    const fullAddress = [
      this.form['address_line'],
      this.form['address_line_2'],
      this.form['city'],
      this.form['state'],
      this.form['postal_code'],
      this.form['country'],
    ].filter(Boolean).join(', ');

    // Try backend first
    this.http.post<GeocodeBackendResponse>(`${environment.apiUrl}/api/geocode`, { address: fullAddress })
      .subscribe({
        next: res => {
          if (res.found) {
            this.applyGeoResult(res.latitude, res.longitude, res.formatted_address);
          } else {
            // Backend couldn't resolve — try client-side Nominatim fallback
            this.geocodeClientSide(fullAddress);
          }
        },
        error: () => {
          // Backend unreachable — try client-side Nominatim fallback
          this.geocodeClientSide(fullAddress);
        },
      });
  }

  /** Client-side fallback: call Nominatim directly from the browser */
  private geocodeClientSide(address: string): void {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    this.http.get<NominatimResult[]>(url, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: results => {
        if (results && results.length > 0) {
          const r = results[0];
          this.applyGeoResult(
            parseFloat(r.lat),
            parseFloat(r.lon),
            r.display_name || address
          );
        } else {
          this.geocoding.set(false);
          this.geocodeError.set('Could not geocode this address. Please try a more specific address.');
        }
      },
      error: () => {
        this.geocoding.set(false);
        this.geocodeError.set('Geocoding service unavailable. Please check your connection and try again.');
      },
    });
  }

  /** Apply geocoding result to form */
  private applyGeoResult(lat: number, lng: number, formattedAddress: string): void {
    this.geocoding.set(false);
    this.form['latitude'] = lat;
    this.form['longitude'] = lng;
    this.form['formatted_address'] = formattedAddress;
    this.form['location_verified'] = true;
    this.locationValidated.set(true);
  }

  resetLocation(): void {
    this.locationValidated.set(false);
    this.form['latitude'] = null;
    this.form['longitude'] = null;
    this.form['formatted_address'] = '';
    this.form['location_verified'] = false;
    this.geocodeError.set('');
    if (this.locationMap) {
      this.locationMap.remove();
      this.locationMap = null;
      this.locationMarker = null;
    }
  }

  ngAfterViewChecked(): void {
    if (this.locationValidated() && this.locationMapEl && !this.locationMap) {
      this.initLocationMap();
    }
  }

  private initLocationMap(): void {
    if (!this.locationMapEl || this.locationMap) return;

    const L = (window as Window & { L?: LeafletLike }).L;
    if (!L) return;

    const lat = this.form.latitude || 13.0827;
    const lng = this.form.longitude || 80.2707;

    this.locationMap = L.map(this.locationMapEl.nativeElement, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(this.locationMap);

    this.locationMarker = L.marker([lat, lng], { draggable: true }).addTo(this.locationMap);

    this.locationMarker.on('dragend', () => {
      const pos = this.locationMarker?.getLatLng();
      if (!pos) return;
      this.form.latitude = pos.lat;
      this.form.longitude = pos.lng;
    });

    setTimeout(() => this.locationMap?.invalidateSize(), 200);
  }

  handleSubmit(): void {
    if (this.currentStep() !== 3) return;
    this.register();
  }

  register(): void {
    this.loading.set(true);
    this.error.set('');

    // Build payload matching the PartnerRegisterRequest schema
    const payload = {
      email: this.form['email'],
      full_name: this.form['full_name'],
      password: this.form['password'],
      legal_name: this.form['legal_name'],
      display_name: this.form['display_name'],
      support_email: this.form['support_email'],
      support_phone: this.form['support_phone'],
      address_line: [this.form['address_line'], this.form['address_line_2']].filter(Boolean).join(', '),
      city: this.form['city'],
      state: this.form['state'],
      country: this.form['country'],
      postal_code: this.form['postal_code'],
      gst_number: this.form['gst_number'] || undefined,
      latitude: this.form['latitude'],
      longitude: this.form['longitude'],
      formatted_address: this.form['formatted_address'],
      location_verified: this.form['location_verified'],
      bank_account_name: this.form['bank_account_name'] || undefined,
      bank_account_number: this.form['bank_account_number'] || undefined,
      bank_ifsc: this.form['bank_ifsc'] || undefined,
      bank_upi_id: this.form['bank_upi_id'] || undefined,
    };

    this.auth.register(payload).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: { error?: { detail?: string } }) => {
        this.error.set(err?.error?.detail || 'Unable to create partner account right now.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
