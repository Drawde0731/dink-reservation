// send-notifications Edge Function
// Processes the pending notifications queue and sends emails via Resend.
// Called by pg_cron every minute (see migration 20260825000006).
// Can also be triggered manually by an admin.
//
// Email types handled:
//   confirmation      — sent after payment, includes manage URL with management token
//   reminder          — sent 24h before the session, includes booking summary
//   cancellation      — sent after customer cancels their booking
//   venue_cancellation — sent when admin cancels a booking (full refund)
//
// Resend env vars: RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. "Beanstalk Dink <noreply@beanstalldink.com>")

import { json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'
import { decryptString } from '../_shared/encrypt.ts'

const BATCH_SIZE = 10
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Beanstalk Dink <noreply@beanstalldink.com>'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// ── Time formatting ────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number)
  const p = h < 12 ? 'AM' : 'PM'
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hr}:${String(m).padStart(2, '0')} ${p}`
}

function fmtPHP(centavos: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(centavos / 100)
}

// ── Email base layout ─────────────────────────────────────────────────────────

function emailBase(subject: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FFFDF7;font-family:Arial,Helvetica,sans-serif;color:#24332B;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFDF7;">
<tr><td align="center" style="padding:32px 16px;">

<table width="600" cellpadding="0" cellspacing="0" border="0"
  style="max-width:600px;width:100%;background:#ffffff;border:1px solid #D4E8DB;border-radius:12px;overflow:hidden;">

  <!-- Header -->
  <tr>
    <td style="background:#276749;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:-0.3px;">Beanstalk Dink</p>
      <p style="margin:4px 0 0;font-size:12px;color:#A8D5BA;">Marilao, Bulacan</p>
    </td>
  </tr>

  <!-- Body -->
  <tr><td style="padding:32px;">${bodyContent}</td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#F2FAF5;border-top:1px solid #D4E8DB;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#66736B;line-height:1.6;">
        Beanstalk Dink · Marilao, Bulacan<br>
        This email was sent because you made a booking on our court reservation system.<br>
        <a href="${APP_ORIGIN}" style="color:#276749;">beanstalldink.com</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #D4E8DB;font-size:13px;color:#66736B;width:40%;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #D4E8DB;font-size:13px;font-weight:600;color:#24332B;">${value}</td>
  </tr>`
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}"
    style="display:inline-block;background:#E76F51;color:#ffffff;padding:14px 28px;border-radius:8px;
           font-weight:bold;font-size:14px;text-decoration:none;margin-top:24px;"
    >${label}</a>`
}

// ── Templates ─────────────────────────────────────────────────────────────────

interface BookingInfo {
  reference: string
  court_name: string
  booking_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  customer_name: string
  deposit_amount: number
  price_per_hour: number
  manage_url?: string  // only for confirmation
}

function confirmationEmail(b: BookingInfo): { subject: string; html: string } {
  const balance = b.price_per_hour * (b.duration_minutes / 60) - b.deposit_amount
  const body = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#276749;">Court Confirmed ✓</h1>
<p style="margin:0 0 24px;font-size:14px;color:#66736B;">Hi ${b.customer_name}, your pickleball court is booked!</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
  ${detailRow('Reference', b.reference)}
  ${detailRow('Court', b.court_name)}
  ${detailRow('Date', fmtDate(b.booking_date))}
  ${detailRow('Time', `${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`)}
  ${detailRow('Duration', `${b.duration_minutes / 60} hour${b.duration_minutes > 60 ? 's' : ''}`)}
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background:#F2FAF5;border:1px solid #D4E8DB;border-radius:8px;padding:16px;margin-bottom:24px;">
<tr>
  <td style="padding:6px 16px;font-size:13px;color:#66736B;">Deposit paid</td>
  <td style="padding:6px 16px;font-size:13px;font-weight:600;color:#24332B;text-align:right;">${fmtPHP(b.deposit_amount)}</td>
</tr>
<tr>
  <td colspan="2" style="border-top:1px solid #D4E8DB;"></td>
</tr>
<tr>
  <td style="padding:6px 16px;font-size:14px;font-weight:bold;color:#24332B;">Balance due at venue</td>
  <td style="padding:6px 16px;font-size:14px;font-weight:bold;color:#E76F51;text-align:right;">${fmtPHP(balance)}</td>
</tr>
</table>

<p style="margin:0 0 16px;font-size:13px;color:#66736B;line-height:1.6;">
  Please bring your booking reference <strong>${b.reference}</strong> when you arrive.
  The balance of <strong>${fmtPHP(balance)}</strong> is collected at the venue.
</p>

<p style="margin:0 0 4px;font-size:13px;color:#66736B;">
  <strong>Cancellation policy:</strong> Cancel 24+ hours before your session for a full deposit refund.
  No-shows forfeit the deposit.
</p>

${b.manage_url ? ctaButton(b.manage_url, 'View & Manage Booking') : ''}
`
  return {
    subject: `Court confirmed — ${b.reference}`,
    html: emailBase(`Court confirmed — ${b.reference}`, body),
  }
}

function reminderEmail(b: BookingInfo): { subject: string; html: string } {
  const balance = b.price_per_hour * (b.duration_minutes / 60) - b.deposit_amount
  const body = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#276749;">Your game is tomorrow! 🏓</h1>
<p style="margin:0 0 24px;font-size:14px;color:#66736B;">Hi ${b.customer_name}, just a quick reminder about your booking.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
  ${detailRow('Reference', b.reference)}
  ${detailRow('Court', b.court_name)}
  ${detailRow('Date', fmtDate(b.booking_date))}
  ${detailRow('Time', `${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`)}
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background:#FFF3EE;border:1px solid #F4A261;border-radius:8px;padding:16px;margin-bottom:24px;">
<tr>
  <td style="padding:4px 16px;font-size:14px;font-weight:bold;color:#E76F51;">
    💰 Balance due at venue: ${fmtPHP(balance)}
  </td>
</tr>
</table>

<p style="margin:0;font-size:13px;color:#66736B;line-height:1.6;">
  Bring your reference <strong>${b.reference}</strong> when you arrive at Beanstalk Dink, Marilao, Bulacan.
  To cancel or view your booking, use the link from your confirmation email.
</p>
`
  return {
    subject: `Court reminder — ${fmtDate(b.booking_date)} · ${b.reference}`,
    html: emailBase(`Reminder: your court tomorrow`, body),
  }
}

function cancellationEmail(b: BookingInfo & { refund_eligible: boolean }): { subject: string; html: string } {
  const body = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#24332B;">Booking Cancelled</h1>
<p style="margin:0 0 24px;font-size:14px;color:#66736B;">
  Hi ${b.customer_name}, your booking has been cancelled.
</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
  ${detailRow('Reference', b.reference)}
  ${detailRow('Court', b.court_name)}
  ${detailRow('Date', fmtDate(b.booking_date))}
  ${detailRow('Time', `${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`)}
</table>

${b.refund_eligible
  ? `<div style="background:#F2FAF5;border:1px solid #D4E8DB;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;font-size:14px;font-weight:bold;color:#276749;">Refund eligible ✓</p>
      <p style="margin:4px 0 0;font-size:13px;color:#66736B;">
        Your deposit refund of ${fmtPHP(b.deposit_amount)} will be processed within 3–5 business days.
      </p>
    </div>`
  : `<div style="background:#FFFDF7;border:1px solid #D4E8DB;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:#66736B;">
        This booking was cancelled within 24 hours of the session start.
        Per our <a href="${APP_ORIGIN}/cancellation-policy" style="color:#276749;">cancellation policy</a>,
        the deposit is non-refundable.
      </p>
    </div>`
}

<p style="margin:0;font-size:13px;color:#66736B;">
  We hope to see you on the courts soon.
  <a href="${APP_ORIGIN}/book" style="color:#276749;">Book again →</a>
</p>
`
  return {
    subject: `Booking cancelled — ${b.reference}`,
    html: emailBase(`Booking cancelled — ${b.reference}`, body),
  }
}

// ── Resend API ────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(`[DEV] Email suppressed (no RESEND_API_KEY). To: ${to} Subject: ${subject}`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
  if (!res.ok) {
    throw new Error(`Resend API ${res.status}: ${await res.text()}`)
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const now = new Date().toISOString()

  // Fetch pending notifications due now (batch)
  const { data: pending, error } = await serviceClient
    .from('notifications')
    .select('id, type, recipient_email, booking_id, metadata, status')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(BATCH_SIZE)

  if (error) return json({ error: 'Failed to query notifications', detail: error.message }, 500)
  if (!pending || pending.length === 0) return json({ processed: 0 })

  let sent = 0, failed = 0

  for (const notif of pending) {
    const { id, type, recipient_email, booking_id, metadata } = notif

    try {
      // Fetch booking + pricing
      const { data: booking } = await serviceClient
        .from('bookings')
        .select(`
          booking_reference, booking_date, start_time, end_time, duration_minutes,
          customer_name, status, court_id,
          courts ( name )
        `)
        .eq('id', booking_id)
        .single()

      if (!booking) throw new Error('Booking not found')

      const { data: pricing } = await serviceClient
        .from('pricing_rules')
        .select('deposit_amount, price_per_hour')
        .eq('court_id', booking.court_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courtName = (booking.courts as any)?.name ?? 'Court'
      const depositAmount = pricing?.deposit_amount ?? 10000
      const pricePerHour = pricing?.price_per_hour ?? 50000

      const info: BookingInfo = {
        reference: booking.booking_reference,
        court_name: courtName,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        duration_minutes: booking.duration_minutes,
        customer_name: booking.customer_name,
        deposit_amount: depositAmount,
        price_per_hour: pricePerHour,
      }

      // For confirmation: decrypt management token to build manage URL
      if (type === 'confirmation' && metadata?.encrypted_token) {
        try {
          const rawToken = await decryptString(metadata.encrypted_token as string)
          info.manage_url = `${APP_ORIGIN}/booking/${booking.booking_reference}?token=${encodeURIComponent(rawToken)}`
        } catch {
          // Non-fatal: email sends without manage link
          console.warn(`send-notifications: could not decrypt token for notification ${id}`)
        }
      }

      let email: { subject: string; html: string }

      switch (type) {
        case 'confirmation':
          email = confirmationEmail(info)
          break
        case 'reminder':
          email = reminderEmail(info)
          break
        case 'cancellation':
          email = cancellationEmail({ ...info, refund_eligible: metadata?.refund_eligible === true })
          break
        case 'venue_cancellation':
          email = cancellationEmail({ ...info, refund_eligible: true })
          break
        default:
          throw new Error(`Unknown notification type: ${type}`)
      }

      await sendEmail(recipient_email, email.subject, email.html)

      await serviceClient
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', id)

      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`send-notifications: failed for notification ${id}:`, message)
      await serviceClient
        .from('notifications')
        .update({ status: 'failed', error: message })
        .eq('id', id)
      failed++
    }
  }

  return json({ processed: sent + failed, sent, failed })
})
