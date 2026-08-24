// get-availability Edge Function
// Returns available time slots for a specific court on a specific date.
// Uses service role to read bookings (no anon read policy on bookings table).
//
// POST /functions/v1/get-availability
// Body: { court_id: string, date: string }  -- date in 'YYYY-MM-DD' Manila time
// Response: { slots: { start_time, end_time, is_available }[] }

import { corsHeaders, handleOptions, json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'
import { dayOfWeekManila, manilaToUTC, parseMinutes } from '../_shared/time.ts'

const VENUE_ID = '00000000-0000-0000-0000-000000000002'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { court_id?: string; date?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { court_id, date } = body
  if (!court_id || !date) {
    return json({ error: 'court_id and date are required' }, 400)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'date must be YYYY-MM-DD' }, 400)
  }

  // Lazily expire stale holds before computing availability
  await serviceClient
    .from('bookings')
    .update({ status: 'expired' })
    .eq('status', 'held')
    .lt('hold_expires_at', new Date().toISOString())

  const dayOfWeek = dayOfWeekManila(date)

  // Fetch operating hours, venue settings, existing bookings, blocked times in parallel
  const [hoursRes, settingsRes, bookingsRes, blockedRes] = await Promise.all([
    serviceClient
      .from('operating_hours')
      .select('open_time, close_time, closes_next_day, is_closed')
      .eq('venue_id', VENUE_ID)
      .eq('day_of_week', dayOfWeek)
      .single(),

    serviceClient
      .from('venue_settings')
      .select('slot_duration_minutes, min_advance_minutes')
      .eq('venue_id', VENUE_ID)
      .single(),

    serviceClient
      .from('bookings')
      .select('start_at, end_at')
      .eq('court_id', court_id)
      .eq('booking_date', date)
      .in('status', ['held', 'confirmed']),

    serviceClient
      .from('blocked_times')
      .select('start_at, end_at')
      .eq('court_id', court_id)
      .lte('start_at', `${date}T23:59:59+08:00`)
      .gte('end_at', `${date}T00:00:00+08:00`),
  ])

  if (hoursRes.error || !hoursRes.data) {
    return json({ error: 'Could not load operating hours' }, 500)
  }
  if (settingsRes.error || !settingsRes.data) {
    return json({ error: 'Could not load venue settings' }, 500)
  }

  const hours = hoursRes.data
  if (hours.is_closed) return json({ slots: [] })

  const settings = settingsRes.data
  const existingBookings = (bookingsRes.data ?? []) as { start_at: string; end_at: string }[]
  const blockedTimes = (blockedRes.data ?? []) as { start_at: string; end_at: string }[]

  // Generate slots
  const openMin = parseMinutes(hours.open_time)
  const closeMin = hours.closes_next_day ? 24 * 60 : parseMinutes(hours.close_time)
  const slotMin = settings.slot_duration_minutes
  const minAdvanceMin = settings.min_advance_minutes
  const nowMs = Date.now()

  const slots: { start_time: string; end_time: string; is_available: boolean }[] = []
  let cursor = openMin

  while (cursor + slotMin <= closeMin) {
    const endCursor = cursor + slotMin
    const fmtStart = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`
    const fmtEnd = endCursor === 1440
      ? '00:00'
      : `${String(Math.floor(endCursor / 60)).padStart(2, '0')}:${String(endCursor % 60).padStart(2, '0')}`

    const slotStartUtc = manilaToUTC(date, fmtStart)
    const slotEndUtc = manilaToUTC(date, fmtEnd, endCursor === 1440)

    // Slot must start at least min_advance_minutes from now
    const tooSoon = slotStartUtc.getTime() - nowMs < minAdvanceMin * 60 * 1000

    // Check overlap with existing bookings
    const hasBookingOverlap = existingBookings.some(b => {
      const bStart = new Date(b.start_at).getTime()
      const bEnd = new Date(b.end_at).getTime()
      return bStart < slotEndUtc.getTime() && bEnd > slotStartUtc.getTime()
    })

    // Check overlap with blocked times
    const hasBlockedOverlap = blockedTimes.some(b => {
      const bStart = new Date(b.start_at).getTime()
      const bEnd = new Date(b.end_at).getTime()
      return bStart < slotEndUtc.getTime() && bEnd > slotStartUtc.getTime()
    })

    slots.push({
      start_time: fmtStart,
      end_time: fmtEnd,
      is_available: !tooSoon && !hasBookingOverlap && !hasBlockedOverlap,
    })

    cursor += slotMin
  }

  return json({ slots })
})
