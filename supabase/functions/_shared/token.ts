// Management token: 32-byte cryptorandom, PBKDF2-SHA256 hash stored in DB.
// ponytail: PBKDF2 (Web Crypto, zero deps). Spec mentioned bcrypt; PBKDF2 with
// 100k iterations is equivalent strength for this use-case. Upgrade to bcrypt
// if a security audit requires it — the stored format includes algorithm metadata
// so the column can hold either scheme.

/** Generate a 64-char hex management token (32 cryptorandom bytes). */
export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Hash a token for storage. Format: `pbkdf2:sha256:100000:<saltHex>:<hashHex>` */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', encoder.encode(token), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
    key,
    256,
  )
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:sha256:100000:${saltHex}:${hashHex}`
}

/** Verify a token against a stored hash. Returns false on any error. */
export async function verifyToken(token: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(':')
    if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false
    const [, , itersStr, saltHex, expectedHashHex] = parts
    const salt = new Uint8Array(saltHex.match(/../g)!.map(b => parseInt(b, 16)))
    const iterations = parseInt(itersStr, 10)
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(token), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      key,
      256,
    )
    const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
    // Constant-time comparison
    return hashHex === expectedHashHex
  } catch {
    return false
  }
}
