// cancel-booking Edge Function
// Allows a customer to cancel their own booking using the management token.
// Phase 6 adds PayMongo refund logic here (within 24h window = full refund).
//
// POST /functions/v1/cancel-booking
// Body: { booking_reference: string, management_token: string }
// Response: { success: true, refund_eligible: boolean }
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

  // Fetch booking
  const { data: booking, error } = await serviceClient
    .from('bookings')
    .select('id, status, management_token_hash, start_at, hold_expires_at, venue_id')
    .eq('booking_reference', booking_reference)
    .single()

  if (error || !booking) {
    return json({ error: 'Booking not found or access denied.', code: 'NOT_FOUND' }, 404)
  }

  // Verify token
  const valid = await verifyToken(management_token, booking.management_token_hash ?? '')
  if (!valid) {
    return json({ error: 'Booking not found or access denied.', code: 'NOT_FOUND' }, 404)
  }

  // Check cancellable status
  if (!['held', 'confirmed'].includes(booking.status)) {
    return json({
      error: `Booking cannot be cancelled (current status: ${booking.status}).`,
      code: 'NOT_CANCELLABLE',
    }, 422)
  }

  // Determine refund eligibility (24h window from cancellation policy)
  const { data: policy } = await serviceClient
    .from('cancellation_policy')
    .select('refund_window_hours')
    .eq('venue_id', booking.venue_id)
    .single()

  const refundWindowHours = policy?.refund_window_hours ?? 24
  const sessionStart = new Date(booking.start_at)
  const hoursUntilSession = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60)
  const refundEligible = booking.status === 'confirmed' && hoursUntilSession >= refundWindowHours

  // Cancel the booking
  const { error: updateErr } = await serviceClient
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', booking.id)

  if (updateErr) {
    console.error('cancel-booking update error:', updateErr)
    return json({ error: 'Failed to cancel booking', code: 'DB_ERROR' }, 500)
  }

  // Audit log
  await serviceClient.from('audit_logs').insert({
    actor_email: 'customer (self-service)',
    action: 'booking.cancelled',
    entity_type: 'booking',
    entity_id: booking.id,
    metadata: { booking_reference, refund_eligible },
  })

  // ponytail: Phase 6 triggers PayMongo refund here when refund_eligible=true.

  return json({ success: true, refund_eligible: refundEligible })
})
