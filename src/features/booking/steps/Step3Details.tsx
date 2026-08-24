import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import type { GuestDetails } from '../types'

interface Props {
  guest: GuestDetails
  onUpdate: (partial: Partial<GuestDetails>) => void
  onNext: () => void
  onBack: () => void
}

// Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX
const PH_PHONE_RE = /^(\+63|0)9\d{9}$/

function validatePhone(v: string): string | null {
  if (!v.trim()) return 'Mobile number is required.'
  if (!PH_PHONE_RE.test(v.trim())) return 'Enter a valid PH mobile number (e.g. 09171234567).'
  return null
}

function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.'
  return null
}

function validateName(v: string): string | null {
  if (!v.trim()) return 'Full name is required.'
  if (v.trim().length < 2) return 'Name must be at least 2 characters.'
  return null
}

export function Step3Details({ guest, onUpdate, onNext, onBack }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const errors = {
    name: validateName(guest.name),
    email: validateEmail(guest.email),
    phone: validatePhone(guest.phone),
  }

  const isValid = !errors.name && !errors.email && !errors.phone

  function blur(field: string) {
    setTouched(t => ({ ...t, [field]: true }))
  }

  function handleSubmit() {
    setTouched({ name: true, email: true, phone: true })
    if (isValid) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Your Details</h2>
        <p className="text-sm text-text-muted mt-1">
          Your booking confirmation and receipt will be sent here. No account required.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Juan dela Cruz"
          value={guest.name}
          onChange={e => onUpdate({ name: e.target.value })}
          onBlur={() => blur('name')}
          error={touched.name ? (errors.name ?? undefined) : undefined}
        />

        <Input
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="juan@example.com"
          value={guest.email}
          onChange={e => onUpdate({ email: e.target.value })}
          onBlur={() => blur('email')}
          error={touched.email ? (errors.email ?? undefined) : undefined}
          helperText="Confirmation email will be sent here."
        />

        <Input
          label="Mobile Number"
          type="tel"
          autoComplete="tel"
          placeholder="09171234567"
          value={guest.phone}
          onChange={e => onUpdate({ phone: e.target.value })}
          onBlur={() => blur('phone')}
          error={touched.phone ? (errors.phone ?? undefined) : undefined}
          helperText="PH mobile number — we'll only contact you about your booking."
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} className="flex-1">
          ← Back
        </Button>
        <Button variant="primary" size="lg" onClick={handleSubmit} className="flex-1">
          Review Booking →
        </Button>
      </div>
    </div>
  )
}
