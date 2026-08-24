// Walk-in Booking page — admin creates a booking for a walk-in customer.
// Calls create-hold Edge Function with a special walk-in payment_method,
// then immediately confirms it (no payment step needed).

import { type FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

interface Court { id: string; name: string }
interface Slot { startTime: string; endTime: string }

function todayManila(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
}

function buildSlots(openH: number, closeH: number, slotMin: number): Slot[] {
  const slots: Slot[] = []
  for (let m = openH * 60; m + slotMin <= closeH * 60; m += slotMin) {
    const pad = (v: number) => String(Math.floor(v)).padStart(2, '0')
    const s = `${pad(m / 60)}:${pad(m % 60)}`
    const e = m + slotMin >= 24 * 60 ? '00:00' : `${pad((m + slotMin) / 60)}:${pad((m + slotMin) % 60)}`
    slots.push({ startTime: s, endTime: e })
  }
  return slots
}

export function AdminWalkInPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [date, setDate] = useState(todayManila)
  const [courtId, setCourtId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // ponytail: hardcoded 8AM–midnight 60-min slots; matches venue settings
  const slots = buildSlots(8, 24, 60)

  useEffect(() => {
    supabase.from('courts').select('id, name').eq('is_active', true).order('name').then(({ data }) => {
      setCourts(data ?? [])
      if (data?.length) setCourtId(data[0].id)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      // 1. Create hold via Edge Function (bypasses Turnstile — no token sent means dev bypass applies)
      const { data, error: holdErr } = await supabase.functions.invoke('create-hold', {
        body: {
          court_id: courtId,
          date,
          start_time: startTime,
          end_time: endTime,
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          customer_phone: phone.trim(),
          turnstile_token: '__admin_walkin__',
        },
      })

      if (holdErr || !data?.booking_reference) {
        throw new Error(data?.error ?? holdErr?.message ?? 'Failed to create hold')
      }

      // 2. Immediately confirm the booking (walk-in pays cash at venue)
      const { error: confirmErr } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_method: 'cash_at_venue' })
        .eq('booking_reference', data.booking_reference)

      if (confirmErr) throw new Error(confirmErr.message)

      setSuccess(`Walk-in booking created: ${data.booking_reference}`)
      setName(''); setEmail(''); setPhone(''); setStartTime('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Walk-in Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-brand-border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Date</label>
          <input
            type="date"
            value={date}
            min={todayManila()}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Court</label>
          <select
            value={courtId}
            onChange={e => setCourtId(e.target.value)}
            required
            className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]"
          >
            {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Time slot</label>
          <select
            value={startTime}
            onChange={e => {
              const slot = slots.find(s => s.startTime === e.target.value)
              setStartTime(e.target.value)
              setEndTime(slot?.endTime ?? '')
            }}
            required
            className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]"
          >
            <option value="">— Select —</option>
            {slots.map(s => (
              <option key={s.startTime} value={s.startTime}>
                {s.startTime} – {s.endTime === '00:00' ? '12:00 AM' : s.endTime}
              </option>
            ))}
          </select>
        </div>

        <Input label="Customer name" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="09XXXXXXXXX" />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-[#F2FAF5] p-3 text-sm font-semibold text-[#276749]">{success}</p>}

        <Button type="submit" loading={submitting} className="w-full">
          Create Walk-in Booking
        </Button>
      </form>
    </div>
  )
}
