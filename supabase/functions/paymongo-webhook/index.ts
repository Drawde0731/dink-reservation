// paymongo-webhook Edge Function
// Handles PayMongo webhook events to keep booking state authoritative.
//
// Supported events:
//   checkout_session.payment.paid  → confirm booking, mark payment paid,
//                                    queue confirmation email (Phase 7)
//
// Webhook URL to register in PayMongo dashboard:
//   https://<project-ref>.supabase.co/functions/v1/paymongo-webhook
//
// Security: HMAC-SHA256 signature verified against PAYMONGO_WEBHOOK_SECRET_KEY.
// Idempotent: duplicate webhook events are safe (payment.paid check).

import { json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'
import { verifyWebhookSignature } from '../_shared/paymongo.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const rawBody = await req.text()
  const webhookSecret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET_KEY')

  // Skip signature verification in dev (no secret set)
  if (webhookSecret) {
    const valid = await verifyWebhookSignature(
      rawBody,
      req.headers.get('paymongo-signature'),
      webhookSecret,
    )
    if (!valid) {
      console.error('paymongo-webhook: invalid signature')
      return json({ error: 'Invalid signature' }, 401)
    }
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const eventType = (event.data as Record<string, unknown>)?.attributes
    ? ((event.data as Record<string, unknown>).attributes as Record<string, unknown>)?.type
    : (event as Record<string, unknown>).type

  // PayMongo wraps events differently depending on the API version.
  // Normalize: look for type at top level or inside data.attributes.
  const type = typeof eventType === 'string' ? eventType
    : typeof (event as Record<string, unknown>).type === 'string'
      ? (event as Record<string, unknown>).type as string
      : ''

  if (type !== 'checkout_session.payment.paid') {
    // Acknowledge unknown events gracefully — don't retry them
    return json({ received: true, handled: false })
  }

  // Extract checkout session from event
  const sessionData = (event.data as Record<string, unknown>)?.attributes as Record<string, unknown> | undefined
  const metadata = (sessionData?.metadata ?? {}) as Record<string, string>
  const checkoutSessionId = (event.data as Record<string, unknown>)?.id as string | undefined

  // Support multi-booking: booking_ids is JSON array; fallback to legacy booking_id
  const bookingIds: string[] = metadata.booking_ids
    ? JSON.parse(metadata.booking_ids)
    : metadata.booking_id ? [metadata.booking_id] : []

  if (bookingIds.length === 0) {
    console.error('paymongo-webhook: no booking_id(s) in metadata', metadata)
    return json({ error: 'No booking_id in metadata' }, 400)
  }

  // Process all bookings (parallel for multi-court)
  const now = new Date().toISOString()

  for (const bookingId of bookingIds) {
    const { data: booking, error: bookingErr } = await serviceClient
      .from('bookings')
      .select('id, status, booking_reference, customer_email, start_at')
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      console.error('paymongo-webhook: booking not found', bookingId)
      continue  // don't fail the whole webhook for one bad ID
    }

    // Idempotent: skip if already confirmed
    if (booking.status === 'confirmed') continue
    if (!['held', 'pending'].includes(booking.status)) {
      console.warn('paymongo-webhook: unexpected status for', bookingId, booking.status)
      continue
    }

    // Confirm
    await serviceClient.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)

    // Activate confirmation notification (created by create-hold with far-future scheduled_at)
    const { error: notifErr } = await serviceClient
      .from('notifications')
      .update({ scheduled_at: now })
      .eq('booking_id', bookingId).eq('type', 'confirmation').eq('status', 'pending')

    if (notifErr) {
      await serviceClient.from('notifications').insert({
        booking_id: bookingId, type: 'confirmation',
        recipient_email: booking.customer_email,
        scheduled_at: now, status: 'pending',
      })
    }

    // Schedule 24h reminder
    if (booking.start_at) {
      const reminderAt = new Date(new Date(booking.start_at).getTime() - 24 * 60 * 60 * 1000)
      if (reminderAt > new Date()) {
        await serviceClient.from('notifications').insert({
          booking_id: bookingId, type: 'reminder',
          recipient_email: booking.customer_email,
          scheduled_at: reminderAt.toISOString(), status: 'pending',
        })
      }
    }

    // Audit log per booking
    await serviceClient.from('audit_logs').insert({
      actor_email: 'paymongo-webhook',
      action: 'booking.confirmed',
      entity_type: 'booking',
      entity_id: bookingId,
      metadata: { booking_reference: booking.booking_reference, checkout_session_id: checkoutSessionId },
    })
  }

  // Mark all payments for this checkout session as paid
  if (checkoutSessionId) {
    await serviceClient
      .from('payments')
      .update({ status: 'paid', paid_at: now })
      .eq('provider_payment_id', checkoutSessionId)
  }

  return json({ received: true, handled: true })
})
