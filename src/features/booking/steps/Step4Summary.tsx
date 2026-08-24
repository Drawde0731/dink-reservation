import { Button } from '../../../components/ui/Button'
import { PriceBreakdown } from '../components/PriceBreakdown'
import type { BookingSelection, GuestDetails, PricingRuleRow } from '../types'
import { formatPHP } from '../../../lib/constants'

interface Props {
  selection: BookingSelection
  guest: GuestDetails
  pricing: PricingRuleRow[]
  onBack: () => void
  // onBook is called by Phase 6 (PayMongo). For Phase 3 it's a stub.
  onBook: () => void
  isSubmitting?: boolean
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function Step4Summary({ selection, guest, pricing, onBack, onBook, isSubmitting }: Props) {
  const rule = pricing.find(p => p.court_id === selection.courtId)

  if (!selection.date || !selection.startTime || !selection.endTime || !selection.courtName || !rule) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Review Your Booking</h2>
        <p className="text-sm text-text-muted mt-1">Check everything before paying the deposit.</p>
      </div>

      {/* Booking summary card */}
      <div className="rounded-xl border border-brand-border divide-y divide-brand-border">
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Court</span>
          <span className="text-sm font-semibold text-text-primary text-right">{selection.courtName}</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Date</span>
          <span className="text-sm font-medium text-text-primary text-right">{formatDisplayDate(selection.date)}</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Time</span>
          <span className="text-sm font-medium text-text-primary text-right">
            {formatTime(selection.startTime)} – {formatTime(selection.endTime)}
          </span>
        </div>
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Duration</span>
          <span className="text-sm font-medium text-text-primary text-right">
            {selection.durationMinutes / 60} {selection.durationMinutes === 60 ? 'hour' : 'hours'}
          </span>
        </div>
      </div>

      {/* Guest details */}
      <div className="rounded-xl border border-brand-border divide-y divide-brand-border">
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Name</span>
          <span className="text-sm font-medium text-text-primary text-right">{guest.name}</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Email</span>
          <span className="text-sm font-medium text-text-primary text-right break-all">{guest.email}</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-start">
          <span className="text-sm text-text-muted">Mobile</span>
          <span className="text-sm font-medium text-text-primary text-right">{guest.phone}</span>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="rounded-xl border border-brand-border p-4">
        <PriceBreakdown
          pricePerHour={rule.price_per_hour}
          depositAmount={rule.deposit_amount}
          durationMinutes={selection.durationMinutes}
        />
      </div>

      {/* Cancellation note */}
      <p className="text-xs text-text-muted text-center">
        Cancel 24+ hours before your session for a full deposit refund. &nbsp;
        <a href="/cancellation-policy" className="underline hover:text-text-primary" target="_blank" rel="noopener noreferrer">
          Full policy →
        </a>
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} className="flex-1" disabled={isSubmitting}>
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onBook}
          loading={isSubmitting}
          className="flex-1"
        >
          Book & Pay {rule ? formatPHP(rule.deposit_amount) : ''} →
        </Button>
      </div>
    </div>
  )
}
