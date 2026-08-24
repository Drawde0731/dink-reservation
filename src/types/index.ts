// Beanstalk Dink — domain types.
// Supabase-generated DB types are added in Phase 2.

export type BookingStatus =
  | 'pending'
  | 'held'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'expired'
  | 'no_show'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export type PaymentMethod = 'online_deposit' | 'cash_at_venue'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Venue {
  id: string
  organization_id: string
  name: string
  address: string
  timezone: string // 'Asia/Manila'
  is_active: boolean
}

export interface Court {
  id: string
  venue_id: string
  name: string // 'Court One' | 'Court Two'
  is_active: boolean
}

/** A single availability slot returned from the booking engine */
export interface TimeSlot {
  court_id: string
  court_name: string
  date: string // 'YYYY-MM-DD' in venue timezone
  start_time: string // 'HH:MM'
  end_time: string // 'HH:MM'
  duration_minutes: number
  is_available: boolean
}

export interface Booking {
  id: string
  booking_reference: string // 'BT-YYYYMMDDNNNN'
  venue_id: string
  court_id: string
  court?: Court
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_date: string // 'YYYY-MM-DD' in venue timezone
  start_time: string // 'HH:MM'
  end_time: string // 'HH:MM'
  duration_minutes: number
  status: BookingStatus
  hold_expires_at: string | null // ISO timestamptz UTC
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  booking_id: string
  provider: 'paymongo'
  provider_payment_id: string
  amount: number // centavos (₱100 = 10000)
  currency: 'PHP'
  status: PaymentStatus
  payment_method: PaymentMethod
  paid_at: string | null
  created_at: string
}

export interface PricingRule {
  id: string
  court_id: string
  price_per_hour: number // centavos — ₱500 = 50000
  deposit_amount: number // centavos — ₱100 = 10000
  effective_from: string
}

/** Computed booking cost shown at checkout */
export interface BookingSummary {
  court_name: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  price_per_hour: number // centavos
  total_price: number // centavos
  deposit_amount: number // centavos
  balance_due: number // centavos — paid at venue
}

/** Error codes from Edge Functions — interpreted by the frontend for friendly messages */
export type AppErrorCode =
  | 'BOOKING_UNAVAILABLE'
  | 'BOOKING_EXPIRED'
  | 'BOOKING_ALREADY_CONFIRMED'
  | 'BOOKING_INVALID'
  | 'VENUE_CLOSED'
  | 'COURT_BLOCKED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'PAYMENT_PROVIDER_ERROR'
  | 'PAYMENT_RECONCILIATION_REQUIRED'
  | 'INVALID_BOOKING_TOKEN'
  | 'RATE_LIMITED'
  | 'TURNSTILE_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NETWORK_ERROR'

export interface AppError {
  code: AppErrorCode
  message: string // customer-facing friendly message
}
