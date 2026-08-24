import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { BookingStatusBadge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import { formatPHP } from '../lib/constants'

interface BookingDetail {
  reference: string
  status: string
  hold_expires_at: string | null
  court_name: string
  booking_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  customer_name: string
  customer_email: string
  customer_phone: string
  deposit_amount: number | null
  price_per_hour: number | null
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function BookingDetailPage() {
  const { reference } = useParams<{ reference: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    if (!reference || !token) {
      setLoading(false)
      setFetchError(null)   // handled below as "no token" case
      return
    }

    supabase.functions
      .invoke('get-booking', { body: { booking_reference: reference, management_token: token } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          setFetchError(data?.error ?? error?.message ?? 'Failed to load booking.')
        } else {
          setBooking(data.booking as BookingDetail)
        }
      })
      .finally(() => setLoading(false))
  }, [reference, token])

  async function handleCancel() {
    if (!reference || !token || !booking) return
    setCancelling(true)
    setCancelError(null)

    const { data, error } = await supabase.functions.invoke('cancel-booking', {
      body: { booking_reference: reference, management_token: token },
    })

    if (error || data?.error) {
      setCancelError(data?.error ?? error?.message ?? 'Failed to cancel booking.')
    } else {
      setCancelDone(true)
      setBooking(b => b ? { ...b, status: 'cancelled' } : b)
    }
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <LoadingSpinner label="Loading booking…" />
      </div>
    )
  }

  // No token in URL (e.g. direct navigation)
  if (!token) {
    return (
      <div className="min-h-screen bg-brand-cream py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-text-muted">
            Use the link in your confirmation email to view your booking details.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-brand-green-dark underline">← Home</Link>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-brand-cream py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700 font-medium">Booking not found</p>
            <p className="text-sm text-red-600 mt-1">{fetchError}</p>
            <Link to="/" className="mt-4 inline-block text-sm text-red-700 underline">← Home</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) return null

  const balance = (booking.price_per_hour ?? 0) - (booking.deposit_amount ?? 0)
  const isCancellable = ['held', 'confirmed'].includes(booking.status)

  return (
    <div className="min-h-screen bg-brand-cream py-8">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">

        {/* Status banner */}
        {booking.status === 'confirmed' && (
          <div className="rounded-2xl border border-brand-border bg-white p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-green-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Booking Confirmed</h1>
            <p className="text-text-muted text-sm">Confirmation sent to {booking.customer_email}</p>
          </div>
        )}

        {booking.status === 'held' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="font-semibold text-amber-800">Payment pending</p>
            <p className="text-sm text-amber-700 mt-0.5">Complete payment to confirm your booking.</p>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="rounded-2xl border border-brand-border bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-text-primary mb-1">Booking Cancelled</h1>
            <p className="text-sm text-text-muted">This booking has been cancelled.</p>
          </div>
        )}

        {cancelDone && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-800">
              Your booking has been cancelled. If a refund is due, it will be processed within 3–5 business days.
            </p>
          </div>
        )}

        {/* Booking details */}
        <div className="rounded-2xl border border-brand-border bg-white shadow-sm divide-y divide-brand-border">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Reference</span>
            <code className="font-mono font-semibold text-text-primary text-sm">{booking.reference}</code>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Status</span>
            <BookingStatusBadge status={booking.status as Parameters<typeof BookingStatusBadge>[0]['status']} />
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Court</span>
            <span className="text-sm font-medium text-text-primary">{booking.court_name}</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Date</span>
            <span className="text-sm font-medium text-text-primary">{formatDate(booking.booking_date)}</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">Time</span>
            <span className="text-sm font-medium text-text-primary">
              {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
            </span>
          </div>
          {booking.deposit_amount && (
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-text-muted">Deposit paid</span>
              <span className="text-sm font-medium text-text-primary">{formatPHP(booking.deposit_amount)}</span>
            </div>
          )}
          {booking.price_per_hour && booking.deposit_amount && (
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-text-muted">Balance at venue</span>
              <span className="text-sm font-semibold text-text-primary">{formatPHP(balance)}</span>
            </div>
          )}
        </div>

        {/* Cancel booking */}
        {isCancellable && !cancelDone && (
          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-text-primary mb-1">Need to cancel?</p>
            <p className="text-sm text-text-muted mb-4">
              Cancellations 24+ hours before your session are eligible for a full deposit refund.
            </p>
            {cancelError && (
              <p className="text-sm text-red-600 mb-3">{cancelError}</p>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              loading={cancelling}
            >
              Cancel This Booking
            </Button>
          </div>
        )}

        <div className="text-center">
          <Link to="/" className="text-sm text-brand-green-dark underline hover:opacity-80">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
