// Booking flow state types — local to the multi-step form.
// Not the DB types from src/types/index.ts.

export type BookingStep = 1 | 2 | 3 | 4

export interface BookingSelection {
  date: string | null       // 'YYYY-MM-DD' in Asia/Manila
  courtId: string | null
  courtName: string | null
  startTime: string | null  // 'HH:MM' 24-hour Manila time
  endTime: string | null    // 'HH:MM' — always startTime + slotDuration
  durationMinutes: number   // V1 fixed at 60
}

export interface GuestDetails {
  name: string
  email: string
  phone: string  // stored as entered; normalized on submit
}

export interface BookingFlowState {
  step: BookingStep
  selection: BookingSelection
  guest: GuestDetails
}

// A single time slot on the availability grid
export interface TimeSlot {
  startTime: string    // 'HH:MM'
  endTime: string      // 'HH:MM'
  isAvailable: boolean
}

// Court row from Supabase (public read)
export interface CourtRow {
  id: string
  name: string
  is_active: boolean
}

// Pricing rule row (most recent effective rule for a court)
export interface PricingRuleRow {
  court_id: string
  price_per_hour: number  // centavos
  deposit_amount: number  // centavos
  effective_from: string
}

// Operating hours row for a day
export interface OperatingHoursRow {
  day_of_week: number     // 0 = Sunday
  open_time: string       // 'HH:MM:SS'
  close_time: string      // 'HH:MM:SS'
  closes_next_day: boolean
  is_closed: boolean
}

export interface VenueSettingsRow {
  booking_window_days: number
  min_advance_minutes: number
  hold_duration_minutes: number
  slot_duration_minutes: number
}
