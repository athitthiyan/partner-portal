import { test, expect, type Page, type Route } from '@playwright/test';

const PARTNER_USER = {
  id: 21,
  email: 'partner@example.com',
  full_name: 'Partner Owner',
  is_admin: false,
  is_partner: true,
  is_active: true,
};

const LOGIN_RESPONSE = {
  access_token: 'partner-access-token',
  refresh_token: 'partner-refresh-token',
  token_type: 'bearer',
  user: PARTNER_USER,
};

const HOTEL = {
  id: 5,
  owner_user_id: 21,
  legal_name: 'StayEase Hospitality Private Limited',
  display_name: 'StayEase Marina Suites',
  gst_number: '33ABCDE1234F1Z5',
  support_email: 'partner@example.com',
  support_phone: '+91 98765 43210',
  address_line: '12 Marina Beach Road',
  city: 'Chennai',
  state: 'Tamil Nadu',
  country: 'India',
  postal_code: '600001',
  description: 'Partner demo hotel for E2E testing.',
  check_in_time: '14:00',
  check_out_time: '11:00',
  cancellation_window_hours: 24,
  instant_confirmation_enabled: true,
  free_cancellation_enabled: true,
  verified_badge: true,
  bank_account_name: 'StayEase Marina Suites',
  bank_account_number_masked: '********9012',
  bank_ifsc: 'HDFC0001234',
  bank_upi_id: 'stayeasepartner@upi',
  payout_cycle: 'weekly',
  payout_currency: 'INR',
  created_at: '2026-04-05T00:00:00Z',
};

const ROOMS = [
  {
    id: 11,
    partner_hotel_id: 5,
    hotel_name: 'StayEase Marina Suites',
    room_type: 'suite',
    description: 'Sea-facing suite with breakfast',
    price: 4800,
    original_price: 5600,
    availability: true,
    image_url: 'https://example.com/room-1.jpg',
    gallery_urls: ['https://example.com/room-1.jpg'],
    amenities: ['Breakfast', 'WiFi'],
    location: 'Near Marina Beach',
    city: 'Chennai',
    country: 'India',
    max_guests: 3,
    beds: 2,
    bathrooms: 1,
    size_sqft: 420,
    floor: 4,
    created_at: '2026-04-05T00:00:00Z',
  },
];

const BOOKINGS = {
  bookings: [
    {
      id: 91,
      booking_ref: 'BK-PARTNER-001',
      user_name: 'Alex Guest',
      email: 'alex@example.com',
      check_in: '2026-06-02T00:00:00Z',
      check_out: '2026-06-04T00:00:00Z',
      guests: 2,
      total_amount: 9600,
      status: 'confirmed',
      payment_status: 'paid',
    },
  ],
  total: 1,
};

const REVENUE = {
  total_bookings: 24,
  confirmed_bookings: 18,
  cancelled_bookings: 2,
  gross_revenue: 184500,
  commission_amount: 27675,
  net_revenue: 156825,
  pending_payouts: 42000,
  paid_out: 114825,
  default_commission_rate: 0.15,
};

const PAYOUTS = {
  payouts: [
    {
      id: 41,
      hotel_id: 5,
      booking_id: 91,
      gross_amount: 9600,
      commission_amount: 1440,
      net_amount: 8160,
      currency: 'INR',
      status: 'processing',
      payout_reference: 'PO-PARTNER-001',
      payout_date: '2026-06-05T00:00:00Z',
      created_at: '2026-04-05T00:00:00Z',
    },
  ],
  total: 1,
};

const CALENDAR = {
  room_id: 11,
  hotel_id: 5,
  days: [
    {
      date: '2026-06-02',
      total_units: 5,
      available_units: 3,
      locked_units: 2,
      status: 'locked',
    },
  ],
};

async function mockPartnerApis(page: Page): Promise<void> {
  let createdRooms = [...ROOMS];
  let savedHotel = { ...HOTEL };

  await page.route('**/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PARTNER_USER),
    });
  });

  await page.route('**/partner/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_RESPONSE),
    });
  });

  await page.route('**/partner/register', async (route: Route) => {
    const body = route.request().postDataJSON();
    savedHotel = {
      ...savedHotel,
      display_name: body.display_name,
      support_email: body.support_email,
      support_phone: body.support_phone,
      gst_number: body.gst_number || null,
      bank_account_name: body.bank_account_name || null,
      bank_ifsc: body.bank_ifsc || null,
      bank_upi_id: body.bank_upi_id || null,
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...LOGIN_RESPONSE,
        user: {
          ...PARTNER_USER,
          full_name: body.full_name,
          email: body.email,
        },
      }),
    });
  });

  await page.route('**/partner/revenue', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(REVENUE),
    });
  });

  await page.route('**/partner/rooms', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON();
      const newRoom = {
        id: createdRooms.length + 11,
        partner_hotel_id: 5,
        hotel_name: savedHotel.display_name,
        room_type: payload.room_type,
        description: payload.description,
        price: payload.price,
        original_price: payload.original_price,
        availability: true,
        image_url: payload.image_url || null,
        gallery_urls: payload.gallery_urls || [],
        amenities: payload.amenities || [],
        location: payload.location || null,
        city: payload.city || 'Chennai',
        country: payload.country || 'India',
        max_guests: payload.max_guests || 2,
        beds: payload.beds || 1,
        bathrooms: payload.bathrooms || 1,
        size_sqft: null,
        floor: null,
        created_at: '2026-04-06T00:00:00Z',
      };
      createdRooms = [...createdRooms, newRoom];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(newRoom),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ rooms: createdRooms, total: createdRooms.length }),
    });
  });

  await page.route('**/partner/bookings', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(BOOKINGS),
    });
  });

  await page.route('**/partner/payouts', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PAYOUTS),
    });
  });

  await page.route('**/partner/calendar**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CALENDAR),
    });
  });

  await page.route('**/partner/hotel', async (route: Route) => {
    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON();
      savedHotel = {
        ...savedHotel,
        ...payload,
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(savedHotel),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(savedHotel),
    });
  });
}

test.describe('Partner Portal End-to-End Flow', () => {
  test('completes partner login, management flow, and logout', async ({ page }) => {
    await mockPartnerApis(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Partner sign in/i })).toBeVisible();

    await page.getByPlaceholder('partner@example.com').fill('partner@example.com');
    await page.getByPlaceholder('Password').fill('PartnerPass123');
    await page.getByRole('button', { name: /Continue to partner hub/i }).click();

    await expect(page).toHaveURL('http://127.0.0.1:4203/');
    await expect(page.getByText('Operate your hotel like a live marketplace partner')).toBeVisible();
    await expect(page.getByText('INR 184500')).toBeVisible();
    await expect(page.getByText('Partner Owner')).toBeVisible();

    await page.getByRole('link', { name: /Rooms/i }).click();
    await expect(page).toHaveURL(/\/rooms$/);
    await expect(page.getByRole('heading', { name: /Room inventory/i })).toBeVisible();
    await expect(page.getByText('StayEase Marina Suites - suite')).toBeVisible();

    await page.getByPlaceholder('Room description').fill('Family suite with balcony');
    await page.getByPlaceholder('Amenities comma separated').fill('Breakfast, Balcony');
    await page.getByPlaceholder('Gallery URLs comma separated').fill('https://example.com/new-room.jpg');
    await page.getByRole('button', { name: /Add room/i }).click();
    await expect(page.getByText('Family suite with balcony')).toBeVisible();

    await page.getByRole('link', { name: /Bookings/i }).click();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(page.getByText('BK-PARTNER-001')).toBeVisible();
    await expect(page.getByText('confirmed / paid')).toBeVisible();

    await page.getByRole('link', { name: /Calendar/i }).click();
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.getByText('2026-06-02')).toBeVisible();
    await expect(page.getByText('Locked: 2')).toBeVisible();

    await page.getByRole('link', { name: /Payouts/i }).click();
    await expect(page).toHaveURL(/\/payouts$/);
    await expect(page.getByText('PO-PARTNER-001')).toBeVisible();
    await expect(page.getByText('Net INR 8160')).toBeVisible();

    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/\/settings$/);
    const displayNameInput = page.getByPlaceholder('Hotel display name');
    await displayNameInput.fill('StayEase Marina Grand');
    await page.getByRole('button', { name: /Save settings/i }).click();
    await expect(displayNameInput).toHaveValue('StayEase Marina Grand');

    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /Partner sign in/i })).toBeVisible();
  });

  test('supports partner registration flow', async ({ page }) => {
    await mockPartnerApis(page);

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /List your hotel on StayEase/i })).toBeVisible();

    await page.getByPlaceholder('Owner full name').fill('New Partner');
    await page.getByPlaceholder('Login email').fill('newpartner@example.com');
    await page.getByPlaceholder('Strong password').fill('PartnerPass123');
    await page.getByPlaceholder('Legal business name').fill('New Partner Hospitality');
    await page.getByPlaceholder('Hotel display name').fill('New Partner Suites');
    await page.getByPlaceholder('Support email').fill('support@newpartner.com');
    await page.getByPlaceholder('Support phone').fill('+91 90000 00000');
    await page.getByPlaceholder('Address line').fill('42 Beach Road');
    await page.getByPlaceholder('City').fill('Chennai');
    await page.getByRole('button', { name: /Create partner account/i }).click();

    await expect(page).toHaveURL('http://127.0.0.1:4203/');
    await expect(page.getByText('New Partner')).toBeVisible();
  });
});
