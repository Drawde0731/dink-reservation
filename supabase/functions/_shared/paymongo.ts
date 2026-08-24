// PayMongo API helpers.
// Secret key is base64-encoded as Basic auth (key + ":" as password).

function authHeader(): string {
  const key = Deno.env.get('PAYMONGO_SECRET_KEY')!
  return 'Basic ' + btoa(key + ':')
}

export const PAYMONGO_BASE = 'https://api.paymongo.com/v1'

export async function paymongoPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PAYMONGO_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayMongo ${path} ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

/** Verify PayMongo webhook HMAC-SHA256 signature. */
export async function verifyWebhookSignature(
  rawBody: string,
  sigHeader: string | null,
  webhookSecret: string,
): Promise<boolean> {
  if (!sigHeader) return false
  // Format: t=TIMESTAMP,te=SIGNED_HASH,li=SIGNED_HASH
  const parts: Record<string, string> = {}
  for (const chunk of sigHeader.split(',')) {
    const idx = chunk.indexOf('=')
    if (idx > 0) parts[chunk.slice(0, idx)] = chunk.slice(idx + 1)
  }
  const timestamp = parts['t']
  const receivedSig = parts['te'] ?? parts['li'] ?? ''
  if (!timestamp || !receivedSig) return false

  const message = `${timestamp}.${rawBody}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const computed = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return computed === receivedSig
}
