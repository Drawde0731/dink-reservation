import { useState, useCallback } from 'react'
import { Button } from '../../../components/ui/Button'
import { TurnstileWidget } from '../../../components/TurnstileWidget'
import type { SlotSelection, GuestDetails, PricingRuleRow } from '../types'
import { formatPHP } from '../../../lib/constants'

interface Props {
  date: string | null
  selections: SlotSelection[]
  guest: GuestDetails
  pricing: PricingRuleRow[]
  onBack: () => void
  onBook: (turnstileToken: string) => void
  isSubmitting?: boolean
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function Step4Summary({ date, selections, guest, pricing, onBack, onBook, isSubmitting }: Props) {
  const [turnstileToken, setTurnstileToken] = useState<string>('')

  const handleVerify = useCallback((token: string) => setTurnstileToken(token), [])
  const handleExpire = useCallback(() => setTurnstileToken(''), [])

  if (!date || selections.length === 0) return null

  const canBook = !!turnstileToken && !isSubmitting

  // Per-selection price breakdown
  const rows = selections.map(sel => {
    const rule = pricing.find(p => p.court_id === sel.courtId)
    const hours = sel.durationMinutes / 60
    const total = rule ? rule.price_per_hour * hours : 0
    const deposit = rule ? rule.deposit_amount * hours : 10000 * hours
    const balance = total - deposit
    return { sel, rule, total, deposit, balance }
  })

  const totalDeposit = rows.reduce((s, r) => s + r.deposit, 0)
  const totalBalance = rows.reduce((s, r) => s + r.balance, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Review Your Booking</h2>
        <p className="text-sm text-text-muted mt-1">Check everything before paying the deposit.</p>
      </div>

      {/* Date */}
      <div className="rounded-xl border border-brand-border divide-y divide-brand-border">
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Date</span>
          <span className="text-sm font-medium text-text-primary text-right">{formatDisplayDate(date)}</span>
        </div>
      </div>

      {/* Per-court breakdown */}
      {rows.map(({ sel, rule, total, deposit, balance }) => (
        <div key={sel.courtId} className="rounded-xl border border-brand-border divide-y divide-brand-border">
          <div className="px-4 py-2.5 bg-brand-surface">
            <span className="text-sm font-semibold text-text-primary">{sel.courtName}</span>
          </div>
          <div className="px-4 py-3 flex justify-between items-start">
            <span className="text-sm text-text-muted">Time</span>
            <span className="text-sm font-medium text-text-primary">
              {formatTime(sel.startTime)} – {formatTime(sel.endTime)}
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between items-start">
            <span className="text-sm text-text-muted">Duration</span>
            <span className="text-sm font-medium text-text-primary">
              {sel.durationMinutes / 60} {sel.durationMinutes === 60 ? 'hour' : 'hours'}
            </span>
          </div>
          {rule && (
            <>
              <div className="px-4 py-3 flex justify-between items-start">
                <span className="text-sm text-text-muted">Court fee</span>
                <span className="text-sm font-medium text-text-primary">{formatPHP(total)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-start">
                <span className="text-sm text-text-muted">Deposit (online)</span>
                <span className="text-sm font-semibold text-[#276749]">{formatPHP(deposit)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-start">
                <span className="text-sm text-text-muted">Balance at venue</span>
                <span className="text-sm font-semibold text-[#E76F51]">{formatPHP(balance)}</span>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Combined total when booking multiple courts */}
      {rows.length > 1 && (
        <div className="rounded-xl border border-[#276749] bg-[#F2FAF5] divide-y divide-[#D4E8DB]">
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-bold text-[#276749]">Total deposit to pay now</span>
            <span className="text-base font-bold text-[#276749]">{formatPHP(totalDeposit)}</span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-text-muted">Total balance at venue</span>
            <span className="text-sm font-semibold text-[#E76F51]">{formatPHP(totalBalance)}</span>
          </div>
        </div>
      )}

      {/* Guest info */}
      <div className="rounded-xl border border-brand-border divide-y divide-brand-border">
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Name</span>
          <span className="text-sm font-medium text-text-primary">{guest.name}</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Email</span>
          <span className="text-sm font-medium text-text-primary break-all">{guest.email}</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Mobile</span>
          <span className="text-sm font-medium text-text-primary">{guest.phone}</span>
        </div>
      </div>

      {/* Turnstile bot check */}
      <TurnstileWidget onVerify={handleVerify} onExpire={handleExpire} />

      {/* Cancellation policy note */}
      <p className="text-xs text-text-muted text-center">
        Cancel 24+ hours before your session for a full deposit refund.{' '}
        <a href="/cancellation-policy" className="underline hover:text-text-primary" target="_blank" rel="noopener noreferrer">
          Full policy
        </a>
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} className="flex-1" disabled={isSubmitting}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => onBook(turnstileToken)}
          loading={isSubmitting}
          disabled={!canBook}
          className="flex-1"
        >
          Book &amp; Pay {formatPHP(totalDeposit)}
        </Button>
      </div>
    </div>
  )
}
