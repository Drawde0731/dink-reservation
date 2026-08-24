// create-checkout-session Edge Function
// Creates a PayMongo Checkout Session for the ₱100 reservation deposit.
// Called immediately after create-hold succeeds.
//
// POST /functions/v1/create-checkout-session
// Body: { booking_reference: string, management_token: string }
// Response: { checkout_url: string }
// Error:    { error: string, code: string }
//
// PayMongo payment methods: gcash + qrph (QR Ph via InstaPay/PESONet)
// On success, PayMongo redirects to: /booking/{ref}?token={token}&paid=1
// On cancel,  PayMongo redirects to: /booking/{ref}?token={token}&cancelled=1

import { handleOptions, json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'
import { verifyToken } from '../_shared/token.ts'
import { paymongoPost } from '../_shared/paymongo.ts'

interface CheckoutSessionResponse {
  data: {
    id: string
    attributes: {
      checkout_url: string
      status: string
    }
  }
}

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

  // Fetch booking + verify management token
  const { data: booking, error: bookingErr } = await serviceClient
    .from('bookings')
    .select(`
      id, booking_reference, status, management_token_hash,
      customer_name, customer_email, hold_expires_at,
      booking_date, start_time, end_time,
      court_id, venue_id,
      courts ( name )
    `)
    .eq('booking_reference', booking_reference)
    .single()

  if (bookingErr || !booking) {
    return json({ error: 'Booking not found', code: 'NOT_FOUND' }, 404)
  }
  if (!await verifyToken(management_token, booking.management_token_hash ?? '')) {
    return json({ error: 'Access denied', code: 'UNAUTHORIZED' }, 403)
  }
  if (booking.status !== 'held') {
    return json({ error: `Booking is not in a payable state (status: ${booking.status})`, code: 'WRONG_STATUS' }, 409)
  }

  // Check hold hasn't expired
  if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
    return json({ error: 'This booking hold has expired. Please book again.', code: 'HOLD_EXPIRED' }, 409)
  }

  // Fetch deposit amount from pricing rules
  const { data: pricing } = await serviceClient
    .from('pricing_rules')
    .select('deposit_amount, price_per_hour')
    .eq('court_id', booking.court_id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()

  const depositAmount = pricing?.deposit_amount ?? 10000  // default ₱100

  // Determine app origin from env (used for redirect URLs)
  const appOrigin = Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courtName = (booking.courts as any)?.name ?? 'Court'
  const description = `${courtName} · ${booking.booking_date} · ${booking.start_time}–${booking.end_time} (Manila)`

  const successUrl = `${appOrigin}/booking/${booking_reference}?token=${encodeURIComponent(management_token)}&paid=1`
  const cancelUrl  = `${appOrigin}/booking/${booking_reference}?token=${encodeURIComponent(management_token)}&cancelled=1`

  let session: CheckoutSessionResponse
  try {
    session = await paymongoPost<CheckoutSessionResponse>('/checkout_sessions', {
      data: {
        attributes: {
          send_email_receipt: false,  // Beanstalk Dink sends its own email (Phase 7)
          show_description: true,
          show_line_items: true,
          cancel_url: cancelUrl,
          success_url: successUrl,
          payment_method_types: ['gcash', 'qrph'],
          line_items: [{
            currency: 'PHP',
            amount: depositAmount,
            description,
            name: 'Beanstalk Dink — Reservation Deposit',
            quantity: 1,
          }],
          metadata: {
            booking_id: booking.id,
            booking_reference,
          },
        },
      },
    })
  } catch (err) {
    console.error('PayMongo create checkout error:', err)
    return json({ error: 'Failed to create payment session. Please try again.', code: 'PAYMONGO_ERROR' }, 502)
  }

  // Record the pending payment in our DB
  await serviceClient.from('payments').insert({
    booking_id: booking.id,
    provider: 'paymongo',
    provider_payment_id: session.data.id,   // checkout session ID
    amount: depositAmount,
    currency: 'PHP',
    status: 'pending',
    payment_method: 'online_deposit',
  })

  return json({ checkout_url: session.data.attributes.checkout_url })
})
