export interface PartnerUser {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_partner: boolean;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: PartnerUser;
}

export interface PartnerRegisterPayload {
  email: string;
  full_name: string;
  password: string;
  legal_name: string;
  display_name: string;
  support_email: string;
  support_phone: string;
  address_line: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  gst_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_upi_id?: string;
}
