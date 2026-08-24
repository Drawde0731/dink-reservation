// AES-GCM helpers for storing the management token encrypted in notification metadata.
// The raw token must survive from create-hold → send-notifications so it can be
// included in the confirmation email URL.
// Env var: TOKEN_ENCRYPTION_KEY — 64 hex chars (32 bytes). Generate with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

async function getKey(): Promise<CryptoKey> {
  const hex = Deno.env.get('TOKEN_ENCRYPTION_KEY')
  if (!hex || hex.length < 64) throw new Error('TOKEN_ENCRYPTION_KEY not set or too short (need 64 hex chars)')
  const raw = new Uint8Array(hex.match(/../g)!.map(b => parseInt(b, 16)))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/** Encrypt a UTF-8 string. Returns a base64-encoded JSON envelope. */
export async function encryptString(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return btoa(JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext)),
  }))
}

/** Decrypt an envelope produced by encryptString. */
export async function decryptString(envelope: string): Promise<string> {
  const key = await getKey()
  const { iv, data } = JSON.parse(atob(envelope)) as { iv: number[]; data: number[] }
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data),
  )
  return new TextDecoder().decode(plaintext)
}
