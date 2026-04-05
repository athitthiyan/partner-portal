export interface PartnerHotel {
  id: number;
  owner_user_id: number;
  legal_name: string;
  display_name: string;
  gst_number?: string | null;
  support_email: string;
  support_phone?: string | null;
  address_line: string;
  city: string;
  state?: string | null;
  country: string;
  postal_code?: string | null;
  description?: string | null;
  check_in_time: string;
  check_out_time: string;
  cancellation_window_hours: number;
  instant_confirmation_enabled: boolean;
  free_cancellation_enabled: boolean;
  verified_badge: boolean;
  bank_account_name?: string | null;
  bank_account_number_masked?: string | null;
  bank_ifsc?: string | null;
  bank_upi_id?: string | null;
  payout_cycle: string;
  payout_currency: string;
  created_at: string;
}

export interface PartnerRoom {
  id: number;
  partner_hotel_id?: number | null;
  hotel_name: string;
  room_type: 'standard' | 'deluxe' | 'suite' | 'penthouse';
  room_type_name: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  total_room_count: number;
  weekend_price?: number | null;
  holiday_price?: number | null;
  extra_guest_charge: number;
  availability: boolean;
  is_active: boolean;
  image_url?: string | null;
  gallery_urls: string[];
  amenities: string[];
  location?: string | null;
  city?: string | null;
  country?: string | null;
  max_guests: number;
  beds: number;
  bathrooms: number;
  size_sqft?: number | null;
  floor?: number | null;
  created_at: string;
}

export interface PartnerRoomListResponse {
  rooms: PartnerRoom[];
  total: number;
}

export interface PartnerBooking {
  id: number;
  booking_ref: string;
  user_name: string;
  email: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_amount: number;
  status: string;
  payment_status: string;
}

export interface PartnerBookingListResponse {
  bookings: PartnerBooking[];
  total: number;
}

export interface PartnerRevenueSummary {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  gross_revenue: number;
  commission_amount: number;
  net_revenue: number;
  pending_payouts: number;
  paid_out: number;
  default_commission_rate: number;
}

export interface PartnerPayout {
  id: number;
  hotel_id: number;
  booking_id?: number | null;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'settled' | 'failed' | 'reversed';
  payout_reference?: string | null;
  payout_date?: string | null;
  statement_generated_at?: string | null;
  created_at: string;
}

export interface PartnerPayoutListResponse {
  payouts: PartnerPayout[];
  total: number;
}

export interface PartnerCalendarDay {
  date: string;
  total_units: number;
  available_units: number;
  locked_units: number;
  booked_units: number;
  blocked_units: number;
  effective_price: number;
  block_reason?: string | null;
  price_override?: number | null;
  price_override_label?: string | null;
  status: string;
}

export interface PartnerCalendarResponse {
  room_id: number;
  hotel_id: number;
  days: PartnerCalendarDay[];
}

export interface PartnerInventoryUpdateRequest {
  room_type_id: number;
  start_date: string;
  end_date: string;
  total_units?: number;
  available_units?: number;
  blocked_units?: number;
  block_reason?: string;
  status?: string;
}

export interface PartnerPricingCalendarDay {
  date: string;
  base_price: number;
  weekend_price?: number | null;
  holiday_price?: number | null;
  effective_price: number;
  override_price?: number | null;
  override_label?: string | null;
}

export interface PartnerPricingCalendarResponse {
  room_type_id: number;
  hotel_id: number;
  days: PartnerPricingCalendarDay[];
}

export interface PartnerPricingUpdateRequest {
  room_type_id: number;
  start_date: string;
  end_date: string;
  price: number;
  label?: string;
}
