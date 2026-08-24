// create-hold Edge Function
// Creates a 10-minute temporary hold on a court slot for a guest customer.
// The DB exclusion constraint prevents double-booking at the database level.
// Returns the booking reference and management token (token never stored raw).
//
// POST /functions/v1/create-hold
// Body: {
//   court_id, date, start_time, end_time,
//   customer_name, customer_email, customer_phone
// }
// Response: { booking_reference, hold_expires_at, management_token }
// Error:    { error: string, code: string }

import { corsHeaders, handleOptions, json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'
import { dayOfWeekManila, manilaToUTC, parseMinutes, todayManila } from '../_shared/time.ts'
import { generateToken, hashToken } from '../_shared/token.ts'

const VENUE_ID = '00000000-0000-0000-0000-000000000002'

// PH mobile: 09XXXXXXXXX or +639XXXXXXXXX
const PH_PHONE_RE = /^(\+63|0)9\d{9}$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400)
  }

  const { court_id, date, start_time, end_time, customer_name, customer_email, customer_phone } = body

  // ── Input validation ──────────────────────────────────────────────────────
  if (!court_id || !date || !start_time || !end_time || !customer_name || !customer_email || !customer_phone) {
    return json({ error: 'All fields are required', code: 'MISSING_FIELDS' }, 400)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'date must be YYYY-MM-DD', code: 'INVALID_DATE' }, 400)
  }
  if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
    return json({ error: 'Times must be HH:MM', code: 'INVALID_TIME' }, 400)
  }
  if (!customer_email.includes('@')) {
    return json({ error: 'Invalid email', code: 'INVALID_EMAIL' }, 400)
  }
  if (!PH_PHONE_RE.test(customer_phone.trim())) {
    return json({ error: 'Invalid PH mobile number', code: 'INVALID_PHONE' }, 400)
  }

  // ── Date boundary check ───────────────────────────────────────────────────
  const today = todayManila()
  if (date < today) {
    return json({ error: 'Cannot book in the past', code: 'PAST_DATE' }, 422)
  }

  // ── Venue settings ────────────────────────────────────────────────────────
  const { data: settings, error: settingsErr } = await serviceClient
    .from('venue_settings')
    .select('booking_window_days, min_advance_minutes, hold_duration_minutes, slot_duration_minutes')
    .eq('venue_id', VENUE_ID)
    .single()

  if (settingsErr || !settings) {
    return json({ error: 'Venue settings unavailable', code: 'CONFIG_ERROR' }, 500)
  }

  // Booking window check
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + settings.booking_window_days)
  const maxDateStr = maxDate.toISOString().slice(0, 10)
  if (date > maxDateStr) {
    return json({ error: 'Date is outside the booking window', code: 'DATE_OUT_OF_WINDOW' }, 422)
  }

  // ── Operating hours validation ────────────────────────────────────────────
  const dayOfWeek = dayOfWeekManila(date)
  const { data: hours, error: hoursErr } = await serviceClient
    .from('operating_hours')
    .select('open_time, close_time, closes_next_day, is_closed')
    .eq('venue_id', VENUE_ID)
    .eq('day_of_week', dayOfWeek)
    .single()

  if (hoursErr || !hours || hours.is_closed) {
    return json({ error: 'Venue is closed on this date', code: 'VENUE_CLOSED' }, 422)
  }

  const slotMin = settings.slot_duration_minutes
  const openMin = parseMinutes(hours.open_time)
  const closeMin = hours.closes_next_day ? 24 * 60 : parseMinutes(hours.close_time)
  const startMin = parseMinutes(start_time)
  const endMin = end_time === '00:00' ? 24 * 60 : parseMinutes(end_time)

  if (startMin < openMin || endMin > closeMin || endMin - startMin !== slotMin) {
    return json({ error: 'Invalid time slot', code: 'INVALID_SLOT' }, 422)
  }

  // ── Minimum advance time check ────────────────────────────────────────────
  const startUTC = manilaToUTC(date, start_time)
  const endUTC = manilaToUTC(date, end_time, end_time === '00:00')
  const minAdvanceMs = settings.min_advance_minutes * 60 * 1000

  if (startUTC.getTime() - Date.now() < minAdvanceMs) {
    return json({ error: 'Booking must be at least 1 hour in advance', code: 'TOO_SOON' }, 422)
  }

  // ── Court existence check ─────────────────────────────────────────────────
  const { data: court, error: courtErr } = await serviceClient
    .from('courts')
    .select('id, name, is_active')
    .eq('id', court_id)
    .single()

  if (courtErr || !court || !court.is_active) {
    return json({ error: 'Court not found or inactive', code: 'COURT_NOT_FOUND' }, 422)
  }

  // ── Generate management token ─────────────────────────────────────────────
  const rawToken = generateToken()
  const tokenHash = await hashToken(rawToken)

  // ── Hold expiry ───────────────────────────────────────────────────────────
  const holdExpiresAt = new Date(Date.now() + settings.hold_duration_minutes * 60 * 1000)

  // ── Insert booking (held) ─────────────────────────────────────────────────
  // generate_booking_reference() is a DB function called via a default expression
  // We call it explicitly via RPC to get the value back
  const { data: refData, error: refErr } = await serviceClient.rpc('generate_booking_reference')
  if (refErr || !refData) {
    return json({ error: 'Failed to generate booking reference', code: 'REF_ERROR' }, 500)
  }
  const bookingReference = refData as string

  const { error: insertErr } = await serviceClient.from('bookings').insert({
    booking_reference: bookingReference,
    venue_id: VENUE_ID,
    court_id,
    customer_name: customer_name.trim(),
    customer_email: customer_email.trim().toLowerCase(),
    customer_phone: customer_phone.trim(),
    booking_date: date,
    start_time,
    end_time,
    duration_minutes: slotMin,
    start_at: startUTC.toISOString(),
    end_at: endUTC.toISOString(),
    status: 'held',
    hold_expires_at: holdExpiresAt.toISOString(),
    management_token_hash: tokenHash,
    payment_method: 'online_deposit',
  })

  if (insertErr) {
    // Exclusion constraint violation = slot was just taken by another booking
    if (insertErr.code === '23P01') {
      return json({ error: 'This slot is no longer available. Please choose another time.', code: 'SLOT_TAKEN' }, 409)
    }
    console.error('create-hold insert error:', insertErr)
    return json({ error: 'Failed to create booking', code: 'DB_ERROR' }, 500)
  }

  return json({
    booking_reference: bookingReference,
    hold_expires_at: holdExpiresAt.toISOString(),
    management_token: rawToken,
    court_name: court.name,
  })
})
