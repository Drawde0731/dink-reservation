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
    .select('id, status, management_token_hash, start_at, hold_expires_at, venue_id, customer_email')
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

  // Trigger PayMongo refund if eligible
  if (refundEligible) {
    const { data: payment } = await serviceClient
      .from('payments')
      .select('provider_payment_id, amount')
      .eq('booking_id', booking.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (payment?.provider_payment_id) {
      try {
        const secret = Deno.env.get('PAYMONGO_SECRET_KEY')
        if (secret) {
          // PayMongo refund API: POST /v1/refunds
          const refundRes = await fetch('https://api.paymongo.com/v1/refunds', {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + btoa(secret + ':'),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: {
                attributes: {
                  payment_id: payment.provider_payment_id,
                  amount: payment.amount,
                  reason: 'customer_request',
                },
              },
            }),
          })
          if (!refundRes.ok) {
            console.error('cancel-booking: PayMongo refund failed', await refundRes.text())
          } else {
            // Update payment status
            await serviceClient
              .from('payments')
              .update({ status: 'refunded' })
              .eq('provider_payment_id', payment.provider_payment_id)
          }
        }
      } catch (err) {
        // Refund failure is non-fatal — booking is still cancelled;
        // admin must process refund manually via PayMongo dashboard.
        console.error('cancel-booking: refund error (manual action required):', err)
      }
    }
  }

  // Queue cancellation email (Phase 7 processes this)
  await serviceClient.from('notifications').insert({
    booking_id: booking.id,
    type: 'cancellation',
    recipient_email: booking.customer_email ?? '',
    scheduled_at: new Date().toISOString(),
    status: 'pending',
  })

  return json({ success: true, refund_eligible: refundEligible })
})
