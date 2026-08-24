import { createClient } from 'jsr:@supabase/supabase-js@2'

// Service role client — bypasses RLS for all booking/payment writes.
// Used only inside Edge Functions; never exposed to the client.
export const serviceClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)
