import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;
  let httpMock: HttpTestingController;
  const authService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    authService.register.mockReset();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  it('navigates to the dashboard after successful registration', () => {
    authService.register.mockReturnValue(of({}));
    fixture.componentInstance.supportPhoneNumber = '98765 43210';

    fixture.componentInstance.register();

    expect(authService.register).toHaveBeenCalledWith({
      email: '',
      full_name: '',
      password: '',
      legal_name: '',
      display_name: '',
      support_email: '',
      support_phone: '+91 98765 43210',
      address_line: '',
      city: '',
      state: '',
      country: 'India',
      postal_code: '',
      gst_number: undefined,
      latitude: null,
      longitude: null,
      formatted_address: '',
      location_verified: false,
      bank_account_name: undefined,
      bank_account_number: undefined,
      bank_ifsc: undefined,
      bank_upi_id: undefined,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('shows backend error details when registration fails', () => {
    authService.register.mockReturnValue(
      throwError(() => ({
        error: { detail: 'Hotel already exists' },
      }))
    );
    fixture.componentInstance.supportPhoneNumber = '98765 43210';

    fixture.componentInstance.register();

    expect(fixture.componentInstance.error()).toBe('Hotel already exists');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('shows FastAPI validation details when registration fails with a 422 payload', () => {
    authService.register.mockReturnValue(
      throwError(() => ({
        error: {
          detail: [
            {
              loc: ['body', 'support_phone'],
              msg: 'String should have at least 7 characters',
            },
          ],
        },
      }))
    );
    fixture.componentInstance.supportPhoneNumber = '12';
    fixture.componentInstance.register();

    expect(fixture.componentInstance.error()).toBe('support_phone: String should have at least 7 characters');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('falls back to a generic message when registration fails without detail', () => {
    authService.register.mockReturnValue(throwError(() => ({})));
    fixture.componentInstance.supportPhoneNumber = '98765 43210';

    fixture.componentInstance.register();

    expect(fixture.componentInstance.error()).toBe('Unable to create partner account right now.');
  });

  it('hydrates states and cities when country and state change', () => {
    const component = fixture.componentInstance;

    component.form.country = 'India';
    component.onCountryChange();
    expect(component.availableStates()).toContain('Tamil Nadu');

    component.form.state = 'Tamil Nadu';
    component.onStateChange();
    expect(component.availableCities()).toContain('Chennai');

    component.form.country = 'Atlantis';
    component.onCountryChange();
    expect(component.availableStates()).toEqual([]);
  });

  it('validates step 1 and address completeness', () => {
    const component = fixture.componentInstance;

    expect(component.isStep1Valid()).toBe(false);
    expect(component.isAddressValid()).toBe(false);

    Object.assign(component.form, {
      full_name: 'Partner Owner',
      email: 'partner@example.com',
      password: 'PartnerPass123',
      legal_name: 'Stayvora Hospitality',
      display_name: 'Stayvora Marina Suites',
      support_email: 'partner@example.com',
      address_line: '12 Marina Beach Road',
      city: 'Chennai',
      country: 'India',
    });
    component.supportPhoneNumber = '98765 43210';

    expect(component.isStep1Valid()).toBe(true);
    expect(component.isAddressValid()).toBe(true);
  });

  it('moves forward and backward between form steps within bounds', () => {
    const component = fixture.componentInstance;

    component.nextStep();
    component.nextStep();
    component.nextStep();
    expect(component.currentStep()).toBe(3);

    component.prevStep();
    component.prevStep();
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });

  it('requires a phone number before submitting the registration', () => {
    fixture.componentInstance.supportPhoneNumber = '';

    fixture.componentInstance.register();

    expect(authService.register).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBe('support_phone: Phone number is required.');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('combines phone code and phone number in the registration payload', () => {
    authService.register.mockReturnValue(of({}));
    fixture.componentInstance.phoneCode = '+44';
    fixture.componentInstance.supportPhoneNumber = '7700 900123';

    fixture.componentInstance.register();

    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({
        support_phone: '+44 7700 900123',
      }),
    );
  });

  it('uses backend geocoding results when available', () => {
    const component = fixture.componentInstance;
    Object.assign(component.form, {
      address_line: '12 Marina Beach Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600001',
      country: 'India',
    });

    component.validateLocation();

    const request = httpMock.expectOne('http://127.0.0.1:8000/api/geocode');
    expect(request.request.method).toBe('POST');
    request.flush({
      found: true,
      latitude: 13.0827,
      longitude: 80.2707,
      formatted_address: '12 Marina Beach Road, Chennai, Tamil Nadu, India',
    });

    expect(component.locationValidated()).toBe(true);
    expect(component.form.latitude).toBe(13.0827);
    expect(component.geocoding()).toBe(false);
  });

  it('falls back to client-side geocoding when backend lookup cannot resolve the address', () => {
    const component = fixture.componentInstance;
    Object.assign(component.form, {
      address_line: '12 Marina Beach Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600001',
      country: 'India',
    });

    component.validateLocation();

    httpMock.expectOne('http://127.0.0.1:8000/api/geocode').flush({ found: false });
    const nominatimRequest = httpMock.expectOne(req => req.url.startsWith('https://nominatim.openstreetmap.org/search?'));
    nominatimRequest.flush([
      {
        lat: '13.0827',
        lon: '80.2707',
        display_name: '12 Marina Beach Road, Chennai, Tamil Nadu, India',
      },
    ]);

    expect(component.locationValidated()).toBe(true);
    expect(component.form.longitude).toBe(80.2707);
  });

  it('shows geocoding errors when both backend and fallback lookup fail', () => {
    const component = fixture.componentInstance;
    Object.assign(component.form, {
      address_line: '12 Marina Beach Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
    });

    component.validateLocation();

    httpMock.expectOne('http://127.0.0.1:8000/api/geocode').flush('boom', {
      status: 500,
      statusText: 'Server Error',
    });
    httpMock.expectOne(req => req.url.startsWith('https://nominatim.openstreetmap.org/search?')).flush('boom', {
      status: 500,
      statusText: 'Server Error',
    });

    expect(component.locationValidated()).toBe(false);
    expect(component.geocodeError()).toContain('Geocoding service unavailable');
    expect(component.geocoding()).toBe(false);
  });

  it('shows a specific message when client-side geocoding returns no results', () => {
    const component = fixture.componentInstance;
    Object.assign(component.form, {
      address_line: 'Unknown address',
      city: 'Unknown city',
      country: 'India',
    });

    component.validateLocation();

    httpMock.expectOne('http://127.0.0.1:8000/api/geocode').flush({ found: false });
    httpMock.expectOne(req => req.url.startsWith('https://nominatim.openstreetmap.org/search?')).flush([]);

    expect(component.locationValidated()).toBe(false);
    expect(component.geocodeError()).toContain('Could not geocode this address');
    expect(component.geocoding()).toBe(false);
  });

  it('resets the verified location and tears down the existing map instance', () => {
    const component = fixture.componentInstance;
    const remove = jest.fn();
    component.form.latitude = 13.0827;
    component.form.longitude = 80.2707;
    component.form.formatted_address = 'Verified address';
    component.form.location_verified = true;
    component.locationValidated.set(true);
    (component as unknown as { locationMap: { remove: () => void } }).locationMap = { remove };

    component.resetLocation();

    expect(component.locationValidated()).toBe(false);
    expect(component.form.latitude).toBeNull();
    expect(remove).toHaveBeenCalled();
  });

  it('only submits on the final step', () => {
    const component = fixture.componentInstance;
    const registerSpy = jest.spyOn(component, 'register').mockImplementation(() => undefined);

    component.currentStep.set(2);
    component.handleSubmit();
    expect(registerSpy).not.toHaveBeenCalled();

    component.currentStep.set(3);
    component.handleSubmit();
    expect(registerSpy).toHaveBeenCalled();
  });

  it('initializes the confirmation map when Leaflet is available after validation', () => {
    const component = fixture.componentInstance;
    const addTo = jest.fn().mockReturnThis();
    const on = jest.fn();
    const markerInstance = {
      addTo,
      on,
      getLatLng: () => ({ lat: 14, lng: 81 }),
    };
    const invalidateSize = jest.fn();
    const mapInstance = { invalidateSize };
    const leaflet = {
      map: jest.fn(() => mapInstance),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => markerInstance),
    };
    Object.defineProperty(window, 'L', {
      configurable: true,
      value: leaflet,
    });
    component.locationMapEl = {
      nativeElement: document.createElement('div'),
    } as never;
    component.form.latitude = 13.0827;
    component.form.longitude = 80.2707;
    component.locationValidated.set(true);

    component.ngAfterViewChecked();

    expect(leaflet.map).toHaveBeenCalled();
    expect(leaflet.marker).toHaveBeenCalledWith([13.0827, 80.2707], { draggable: true });
    expect(on).toHaveBeenCalledWith('dragend', expect.any(Function));
  });

  it('updates coordinates when the draggable map marker is moved', () => {
    const component = fixture.componentInstance;
    let dragendHandler: (() => void) | undefined;
    const markerInstance = {
      addTo: jest.fn().mockReturnThis(),
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'dragend') {
          dragendHandler = handler;
        }
      }),
      getLatLng: () => ({ lat: 14, lng: 81 }),
    };
    Object.defineProperty(window, 'L', {
      configurable: true,
      value: {
        map: jest.fn(() => ({ invalidateSize: jest.fn() })),
        tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
        marker: jest.fn(() => markerInstance),
      },
    });
    component.locationMapEl = { nativeElement: document.createElement('div') } as never;
    component.form.latitude = 13.0827;
    component.form.longitude = 80.2707;
    component.locationValidated.set(true);

    component.ngAfterViewChecked();
    dragendHandler?.();

    expect(component.form.latitude).toBe(14);
    expect(component.form.longitude).toBe(81);
  });
});
