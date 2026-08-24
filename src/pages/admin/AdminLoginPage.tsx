// Admin login page.
// Supabase Auth magic link (email OTP) — no password required.
// enable_signup=false, so only invited admins can sign in.

import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdminAuth } from '../../features/admin/hooks/useAdminAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function AdminLoginPage() {
  const { session, loading } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in
  if (!loading && session) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },  // invited admins only
    })
    setSubmitting(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold text-brand-green-dark">Beanstalk Dink</p>
          <p className="mt-1 text-sm text-text-muted">Admin sign in</p>
        </div>

        {sent ? (
          <div className="rounded-lg bg-[#F2FAF5] p-4 text-center text-sm text-text-primary">
            <p className="font-semibold text-[#276749]">Check your email ✓</p>
            <p className="mt-1 text-text-muted">
              We sent a sign-in link to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@beanstalldink.com"
              error={error || undefined}
            />
            <Button type="submit" loading={submitting} className="w-full" disabled={!email.trim()}>
              Send sign-in link
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
