// Court blocking page — admin blocks a court for maintenance, events, etc.
// Writes directly to blocked_times table via service client (admin-only, RLS allows admin role).
// Uses Supabase anon key but admin is authenticated so RLS `auth.role()='authenticated'` covers it.

import { type FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

interface Court { id: string; name: string }
interface BlockedTime {
  id: string
  court_id: string
  court_name: string
  start_at: string
  end_at: string
  reason: string
}

function todayManila(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
}

function fmtLocal(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function AdminBlockPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [courtId, setCourtId] = useState('')
  const [startDate, setStartDate] = useState(todayManila)
  const [startHour, setStartHour] = useState('08:00')
  const [endDate, setEndDate] = useState(todayManila)
  const [endHour, setEndHour] = useState('10:00')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [blocks, setBlocks] = useState<BlockedTime[]>([])
  const [loadingBlocks, setLoadingBlocks] = useState(true)

  useEffect(() => {
    supabase.from('courts').select('id, name').eq('is_active', true).order('name').then(({ data }) => {
      setCourts(data ?? [])
      if (data?.length) setCourtId(data[0].id)
    })
    loadBlocks()
  }, [])

  async function loadBlocks() {
    setLoadingBlocks(true)
    const { data } = await supabase
      .from('blocked_times')
      .select('id, court_id, start_at, end_at, reason, courts(name)')
      .gte('end_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(50)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBlocks((data ?? []).map((b: any) => ({ ...b, court_name: b.courts?.name ?? '—' })))
    setLoadingBlocks(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    // Convert Manila local datetime to UTC ISO strings
    const startISO = new Date(`${startDate}T${startHour}:00+08:00`).toISOString()
    const endISO = new Date(`${endDate}T${endHour}:00+08:00`).toISOString()

    if (endISO <= startISO) {
      setError('End time must be after start time')
      setSubmitting(false)
      return
    }

    const { error: err } = await supabase.from('blocked_times').insert({
      court_id: courtId,
      start_at: startISO,
      end_at: endISO,
      reason: reason.trim() || null,
    })

    setSubmitting(false)
    if (err) { setError(err.message); return }
    setSuccess('Court blocked successfully.')
    setReason('')
    loadBlocks()
  }

  async function removeBlock(id: string) {
    await supabase.from('blocked_times').delete().eq('id', id)
    loadBlocks()
  }

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Block Court</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-2xl border border-brand-border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Court</label>
          <select value={courtId} onChange={e => setCourtId(e.target.value)} required
            className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]">
            {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Start date</label>
            <input type="date" value={startDate} min={todayManila()} onChange={e => setStartDate(e.target.value)} required
              className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Start time</label>
            <select value={startHour} onChange={e => setStartHour(e.target.value)} required
              className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]">
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">End date</label>
            <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} required
              className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">End time</label>
            <select value={endHour} onChange={e => setEndHour(e.target.value)} required
              className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]">
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        <Input label="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} placeholder="Maintenance, private event…" />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-[#F2FAF5] p-3 text-sm font-semibold text-[#276749]">{success}</p>}

        <Button type="submit" loading={submitting} className="w-full">Block court</Button>
      </form>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Upcoming blocks
      </h2>

      {loadingBlocks && <p className="text-sm text-text-muted">Loading…</p>}
      {!loadingBlocks && blocks.length === 0 && (
        <p className="text-sm text-text-muted">No upcoming blocks.</p>
      )}
      {blocks.map(b => (
        <div key={b.id} className="mb-2 flex items-start justify-between rounded-xl border border-brand-border bg-white p-4">
          <div>
            <p className="font-semibold text-text-primary">{b.court_name}</p>
            <p className="text-sm text-text-muted">{fmtLocal(b.start_at)} → {fmtLocal(b.end_at)}</p>
            {b.reason && <p className="text-sm text-text-muted">{b.reason}</p>}
          </div>
          <button onClick={() => removeBlock(b.id)}
            className="ml-4 rounded-lg px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-50">
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
