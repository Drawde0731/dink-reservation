// expire-holds Edge Function
// Expires all held bookings whose hold_expires_at has passed.
// Called by the pg_cron schedule (every minute) set up in the hold_expiry migration.
// Can also be called manually by an admin for immediate cleanup.
//
// POST /functions/v1/expire-holds
// No body required. Auth: service role key (set in cron) or admin JWT.
// Response: { expired_count: number }

import { handleOptions, json } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase-service.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { error, count } = await serviceClient
    .from('bookings')
    .update({ status: 'expired' })
    .eq('status', 'held')
    .lt('hold_expires_at', new Date().toISOString())

  if (error) {
    console.error('expire-holds error:', error)
    return json({ error: 'Failed to expire holds' }, 500)
  }

  return json({ expired_count: count ?? 0 })
})
