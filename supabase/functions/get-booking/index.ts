// get-booking Edge Function
// Allows a customer to view their own booking using the management token
// sent in their confirmation email URL.
//
// POST /functions/v1/get-booking
// Body: { booking_reference: string, management_token: string }
// Response: { booking: { reference, court_name, date, start_time, end_time,
//             duration_minutes, status, hold_expires_at, customer_name,
//             customer_email, deposit_amount } }
// Error: { error, code }

import { handleOptions, json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'
import { verifyToken } from '../_shared/token.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)

  let body: { booking_reference?: string; management_token?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400)
  }

  const { booking_reference, management_token } = body
  if (!booking_reference || !management_token) {
    return json({ error: 'booking_reference and management_token are required', code: 'MISSING_FIELDS' }, 400)
  }

  // Fetch booking by reference
  const { data: booking, error } = await serviceClient
    .from('bookings')
    .select(`
      id, booking_reference, status, hold_expires_at,
      customer_name, customer_email, customer_phone,
      booking_date, start_time, end_time, duration_minutes,
      management_token_hash, payment_method,
      court_id,
      courts ( name )
    `)
    .eq('booking_reference', booking_reference)
    .single()

  if (error || !booking) {
    // Generic message — don't leak whether reference exists
    return json({ error: 'Booking not found or access denied.', code: 'NOT_FOUND' }, 404)
  }

  // Verify management token
  const tokenHash = booking.management_token_hash as string | null
  if (!tokenHash) {
    return json({ error: 'Booking not found or access denied.', code: 'NOT_FOUND' }, 404)
  }
  const valid = await verifyToken(management_token, tokenHash)
  if (!valid) {
    return json({ error: 'Booking not found or access denied.', code: 'NOT_FOUND' }, 404)
  }

  // Get deposit amount from pricing_rules
  const { data: pricing } = await serviceClient
    .from('pricing_rules')
    .select('deposit_amount, price_per_hour')
    .eq('court_id', booking.court_id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const court = (booking.courts as any)
  return json({
    booking: {
      reference: booking.booking_reference,
      status: booking.status,
      hold_expires_at: booking.hold_expires_at,
      court_name: court?.name ?? '',
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration_minutes: booking.duration_minutes,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      payment_method: booking.payment_method,
      deposit_amount: pricing?.deposit_amount ?? null,
      price_per_hour: pricing?.price_per_hour ?? null,
    },
  })
})
