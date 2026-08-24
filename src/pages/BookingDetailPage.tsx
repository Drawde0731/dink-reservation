import { useParams } from 'react-router-dom'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { BookingStatusBadge } from '../components/ui/Badge'

// Phase 4 wires this to the Supabase Edge Function that verifies the
// management token and returns booking details for the customer to view.
//
// For Phase 3, this page renders a skeleton with the reference from the URL.

export function BookingDetailPage() {
  const { reference } = useParams<{ reference: string }>()

  // ponytail: Phase 4 adds `useBookingDetail(reference, token)` here.
  const loading = false

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <LoadingSpinner label="Loading booking…" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream py-8">
      <div className="container mx-auto px-4 max-w-2xl">

        {/* Success banner — shown after Phase 6 redirects here post-payment */}
        <div className="rounded-2xl border border-brand-border bg-white p-8 text-center shadow-sm mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-green-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Booking Confirmed</h1>
          <p className="text-text-muted text-sm">
            A confirmation email has been sent to your address.
          </p>
        </div>

        {/* Booking reference card */}
        <div className="rounded-2xl border border-brand-border bg-white shadow-sm divide-y divide-brand-border mb-6">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Reference</span>
            <code className="font-mono font-semibold text-text-primary text-sm">{reference}</code>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Status</span>
            <BookingStatusBadge status="confirmed" />
          </div>

          {/* Phase 4 fills these in from the database */}
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Court</span>
            <span className="text-sm font-medium text-text-primary">—</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Date</span>
            <span className="text-sm font-medium text-text-primary">—</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Time</span>
            <span className="text-sm font-medium text-text-primary">—</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Balance at venue</span>
            <span className="text-sm font-semibold text-text-primary">—</span>
          </div>
        </div>

        {/* Actions — Phase 5 enables the cancel button with management token auth */}
        <div className="text-center space-y-3">
          <p className="text-sm text-text-muted">
            Need to cancel? Use the link in your confirmation email.
          </p>
          <a
            href="/"
            className="inline-block text-sm text-brand-green-dark underline hover:text-brand-green-dark/80"
          >
            ← Back to home
          </a>
        </div>

      </div>
    </div>
  )
}
