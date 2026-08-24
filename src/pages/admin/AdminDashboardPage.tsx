// Admin Dashboard — daily booking agenda per court.
// Defaults to today (Asia/Manila); navigate forward/back by day.

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { cn } from '../../lib/cn'

interface BookingRow {
  id: string
  booking_reference: string
  customer_name: string
  customer_email: string
  customer_phone: string
  court_id: string
  court_name: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  deposit_amount: number
  price_per_hour: number
}

function todayManila(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function fmtTime(hhmm: string): string {
  const [h, min] = hhmm.slice(0, 5).split(':').map(Number)
  const p = h < 12 ? 'AM' : 'PM'
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hr}:${String(min).padStart(2, '0')} ${p}`
}

function fmtPHP(centavos: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(centavos / 100)
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return dt.toLocaleDateString('en-CA')
}

const statusColor: Record<string, string> = {
  confirmed: 'bg-[#276749] text-white',
  held: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-700',
}

export function AdminDashboardPage() {
  const [date, setDate] = useState(todayManila)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    supabase
      .from('bookings')
      .select(`
        id, booking_reference, customer_name, customer_email, customer_phone,
        court_id, start_time, end_time, duration_minutes, status,
        courts ( name ),
        pricing_rules ( deposit_amount, price_per_hour )
      `)
      .eq('booking_date', date)
      .in('status', ['confirmed', 'held', 'cancelled'])
      .order('start_time', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: BookingRow[] = (data ?? []).map((b: any) => ({
          ...b,
          court_name: b.courts?.name ?? '—',
          deposit_amount: b.pricing_rules?.deposit_amount ?? 10000,
          price_per_hour: b.pricing_rules?.price_per_hour ?? 50000,
        }))
        setBookings(rows)
        setLoading(false)
      })
  }, [date])

  const byCourtId = bookings.reduce<Record<string, BookingRow[]>>((acc, b) => {
    ;(acc[b.court_id] ??= []).push(b)
    return acc
  }, {})

  const courtIds = [...new Set(bookings.map(b => b.court_id))]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Bookings</h1>
          <p className="text-sm text-text-muted">{fmtDate(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDate(d => addDays(d, -1))}>← Prev</Button>
          <Button variant="ghost" size="sm" onClick={() => setDate(todayManila())}>Today</Button>
          <Button variant="ghost" size="sm" onClick={() => setDate(d => addDays(d, 1))}>Next →</Button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-xl border border-brand-border bg-white p-12 text-center text-text-muted">
          No bookings on this date.
        </div>
      )}

      {!loading && courtIds.map(courtId => (
        <div key={courtId} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {byCourtId[courtId][0].court_name}
          </h2>
          <div className="space-y-2">
            {byCourtId[courtId].map(b => {
              const total = b.price_per_hour * (b.duration_minutes / 60)
              const balance = total - b.deposit_amount
              return (
                <div
                  key={b.id}
                  className="flex flex-col gap-2 rounded-xl border border-brand-border bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">
                        {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', statusColor[b.status] ?? 'bg-gray-100 text-gray-600')}>
                        {b.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-primary">{b.customer_name}</p>
                    <p className="text-xs text-text-muted">{b.customer_email} · {b.customer_phone}</p>
                    <p className="mt-1 text-xs text-text-muted font-mono">{b.booking_reference}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-text-muted">Total <span className="font-semibold text-text-primary">{fmtPHP(total)}</span></p>
                    <p className="text-text-muted">Deposit <span className="text-[#276749] font-semibold">{fmtPHP(b.deposit_amount)} ✓</span></p>
                    {b.status === 'confirmed' && (
                      <p className="text-text-muted">Balance <span className="font-semibold text-[#E76F51]">{fmtPHP(balance)}</span></p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
