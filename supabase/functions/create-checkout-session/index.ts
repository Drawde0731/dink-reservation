// create-checkout-session Edge Function
// Creates a single PayMongo Checkout Session for one or more booking holds.
// Accepts multiple booking_references (multi-court booking) or a single one.
//
// POST /functions/v1/create-checkout-session
// Body: { booking_references: string[], management_tokens: string[] }
//   (also accepts legacy: { booking_reference: string, management_token: string })
// Response: { checkout_url: string }
// Error:    { error: string, code: string }

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

  let body: {
    booking_references?: string[]
    management_tokens?: string[]
    // Legacy single-booking fields
    booking_reference?: string
    management_token?: string
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400)
  }

  // Normalise to arrays (support both single and multi)
  const refs   = body.booking_references ?? (body.booking_reference ? [body.booking_reference] : [])
  const tokens = body.management_tokens  ?? (body.management_token  ? [body.management_token]  : [])

  if (refs.length === 0 || tokens.length !== refs.length) {
    return json({ error: 'booking_references and management_tokens are required and must match in length', code: 'MISSING_FIELDS' }, 400)
  }

  const appOrigin = Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'

  // Fetch all bookings + verify tokens
  const bookings = []
  let totalDeposit = 0
  const descriptions: string[] = []

  for (let i = 0; i < refs.length; i++) {
    const ref   = refs[i]
    const token = tokens[i]

    const { data: booking, error: bookingErr } = await serviceClient
      .from('bookings')
      .select(`
        id, booking_reference, status, management_token_hash,
        customer_name, customer_email, hold_expires_at,
        booking_date, start_time, end_time, duration_minutes, court_id,
        courts ( name )
      `)
      .eq('booking_reference', ref)
      .single()

    if (bookingErr || !booking) {
      return json({ error: `Booking ${ref} not found`, code: 'NOT_FOUND' }, 404)
    }
    if (!await verifyToken(token, booking.management_token_hash ?? '')) {
      return json({ error: 'Access denied', code: 'UNAUTHORIZED' }, 403)
    }
    if (booking.status !== 'held') {
      return json({ error: `Booking ${ref} is not in a payable state (status: ${booking.status})`, code: 'WRONG_STATUS' }, 409)
    }
    if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
      return json({ error: `Hold for ${ref} has expired. Please book again.`, code: 'HOLD_EXPIRED' }, 409)
    }

    // Fetch deposit
    const { data: pricing } = await serviceClient
      .from('pricing_rules')
      .select('deposit_amount, price_per_hour')
      .eq('court_id', booking.court_id)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    const hours = (booking.duration_minutes ?? 60) / 60
    const deposit = (pricing?.deposit_amount ?? 10000) * hours
    totalDeposit += deposit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courtName = (booking.courts as any)?.name ?? 'Court'
    descriptions.push(`${courtName} · ${booking.booking_date} · ${booking.start_time}–${booking.end_time}`)
    bookings.push({ booking, token, deposit })
  }

  // Build redirect URLs — use the first booking as the primary
  const primaryRef   = refs[0]
  const primaryToken = tokens[0]
  const successUrl = `${appOrigin}/booking/${primaryRef}?token=${encodeURIComponent(primaryToken)}&paid=1`
  const cancelUrl  = `${appOrigin}/booking/${primaryRef}?token=${encodeURIComponent(primaryToken)}&cancelled=1`

  const lineItemName = refs.length === 1
    ? 'Beanstalk Dink — Reservation Deposit'
    : `Beanstalk Dink — Reservation Deposit (${refs.length} courts)`

  let session: CheckoutSessionResponse
  try {
    session = await paymongoPost<CheckoutSessionResponse>('/checkout_sessions', {
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          cancel_url: cancelUrl,
          success_url: successUrl,
          payment_method_types: ['gcash', 'qrph'],
          line_items: [{
            currency: 'PHP',
            amount: totalDeposit,
            description: descriptions.join(' | '),
            name: lineItemName,
            quantity: 1,
          }],
          metadata: {
            // Store all booking IDs so paymongo-webhook can confirm all of them
            booking_id:   bookings[0].booking.id,  // legacy field
            booking_ids:  JSON.stringify(bookings.map(b => b.booking.id)),
            booking_reference: primaryRef,
          },
        },
      },
    })
  } catch (err) {
    console.error('PayMongo create checkout error:', err)
    return json({ error: 'Failed to create payment session. Please try again.', code: 'PAYMONGO_ERROR' }, 502)
  }

  // Record pending payment for each booking
  for (const { booking, deposit } of bookings) {
    await serviceClient.from('payments').insert({
      booking_id: booking.id,
      provider: 'paymongo',
      provider_payment_id: session.data.id,
      amount: deposit,
      currency: 'PHP',
      status: 'pending',
      payment_method: 'online_deposit',
    })
  }

  return json({ checkout_url: session.data.attributes.checkout_url })
})
