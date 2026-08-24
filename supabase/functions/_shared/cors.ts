// CORS headers for all Edge Functions.
// Origin is '*' for V1 (localhost + Cloudflare Pages).
// Phase 10: restrict to the production domain.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
} as const

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
