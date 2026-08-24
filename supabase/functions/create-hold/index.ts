// create-hold Edge Function
// Creates a 10-minute temporary hold on a court slot for a guest customer.
// The DB exclusion constraint prevents double-booking at the database level.
// Returns the booking reference and management token (token never stored raw).
//
// Security:
//   - Cloudflare Turnstile server-side verification (bypassed in dev if key absent)
//   - Rate limit: max 3 active holds/confirmed bookings per email in 24h
//   - All validation is server-side; DB constraint is the last line of defense
//
// POST /functions/v1/create-hold
// Body: {
//   court_id, date, start_time, end_time,
//   customer_name, customer_email, customer_phone,
//   turnstile_token
// }
// Response: { booking_reference, hold_expires_at, management_token }
// Error:    { error: string, code: string }

import { corsHeaders, handleOptions, json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'
import { dayOfWeekManila, manilaToUTC, parseMinutes, todayManila } from '../_shared/time.ts'
import { generateToken, hashToken } from '../_shared/token.ts'
import { encryptString } from '../_shared/encrypt.ts'

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

  const {
    court_id, date, start_time, end_time,
    customer_name, customer_email, customer_phone,
    turnstile_token,
  } = body

  // ── Cloudflare Turnstile verification ─────────────────────────────────────
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (turnstileSecret) {
    if (!turnstile_token) {
      return json({ error: 'Bot protection token is required', code: 'TURNSTILE_MISSING' }, 422)
    }
    // Dev bypass or admin walk-in bypass — skip Cloudflare verification
    if (turnstile_token !== '__dev_bypass__' && turnstile_token !== '__admin_walkin__') {
      const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstile_token,
          remoteip: req.headers.get('cf-connecting-ip') ?? undefined,
        }),
      })
      const tsData = await tsRes.json() as { success: boolean }
      if (!tsData.success) {
        return json({ error: 'Bot protection check failed. Please try again.', code: 'TURNSTILE_FAILED' }, 422)
      }
    }
  }

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

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // Max 3 active bookings per email per 24h to prevent bulk-holding abuse.
  // ponytail: DB-based rate limit, no external service needed for V1.
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: activeCount } = await serviceClient
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', customer_email.trim().toLowerCase())
    .in('status', ['held', 'confirmed'])
    .gte('created_at', since24h)

  if ((activeCount ?? 0) >= 3) {
    return json({
      error: 'You have too many active bookings. Please contact us if you need assistance.',
      code: 'RATE_LIMITED',
    }, 429)
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

  // Queue confirmation notification (status=pending, far-future scheduled_at).
  // The paymongo-webhook sets scheduled_at=now() after payment success to activate it.
  // The encrypted management token is stored in metadata so the email can include
  // the full manage URL (token decrypted and injected at send time by send-notifications).
  // Migration 20260825000005 adds the metadata jsonb column.
  try {
    const encryptedToken = await encryptString(rawToken)
    const { data: bk } = await serviceClient
      .from('bookings').select('id').eq('booking_reference', bookingReference).single()

    await serviceClient.from('notifications').insert({
      booking_id: bk?.id,
      type: 'confirmation',
      recipient_email: customer_email.trim().toLowerCase(),
      // Far future: paymongo-webhook moves this to now() on payment confirmed
      scheduled_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      metadata: { encrypted_token: encryptedToken },
    })
  } catch (err) {
    // Non-fatal: booking hold exists; email will send without manage link
    console.warn('create-hold: could not queue confirmation notification:', err)
  }

  return json({
    booking_reference: bookingReference,
    hold_expires_at: holdExpiresAt.toISOString(),
    management_token: rawToken,
    court_name: court.name,
  })
})
