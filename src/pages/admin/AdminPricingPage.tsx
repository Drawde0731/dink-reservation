// Pricing management page.
// Shows current pricing per court and lets admin create a new pricing rule
// (effective from a chosen date). Historical rules are preserved for audit.

import { type FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'

interface Court { id: string; name: string }
interface PricingRule {
  id: string
  court_id: string
  court_name: string
  price_per_hour: number
  deposit_amount: number
  effective_from: string
}

function fmtPHP(centavos: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(centavos / 100)
}

function todayManila(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
}

export function AdminPricingPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [courtId, setCourtId] = useState('')
  const [pricePerHour, setPricePerHour] = useState('500')
  const [depositAmount, setDepositAmount] = useState('100')
  const [effectiveFrom, setEffectiveFrom] = useState(todayManila)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('courts').select('id, name').eq('is_active', true).order('name'),
      supabase
        .from('pricing_rules')
        .select('id, court_id, price_per_hour, deposit_amount, effective_from, courts(name)')
        .order('effective_from', { ascending: false })
        .limit(50),
    ]).then(([{ data: c }, { data: r }]) => {
      setCourts(c ?? [])
      if (c?.length) setCourtId(c[0].id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRules((r ?? []).map((rule: any) => ({ ...rule, court_name: rule.courts?.name ?? '—' })))
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const pph = Math.round(parseFloat(pricePerHour) * 100)
    const dep = Math.round(parseFloat(depositAmount) * 100)

    if (isNaN(pph) || pph <= 0) { setError('Price per hour must be a positive number'); return }
    if (isNaN(dep) || dep < 0) { setError('Deposit amount must be non-negative'); return }
    if (dep >= pph) { setError('Deposit must be less than the hourly rate'); return }

    setSubmitting(true)
    const { error: err } = await supabase.from('pricing_rules').insert({
      court_id: courtId,
      price_per_hour: pph,
      deposit_amount: dep,
      effective_from: effectiveFrom,
    })
    setSubmitting(false)

    if (err) { setError(err.message); return }
    setSuccess(`New pricing rule saved (effective ${effectiveFrom}).`)

    // Reload rules
    const { data: fresh } = await supabase
      .from('pricing_rules')
      .select('id, court_id, price_per_hour, deposit_amount, effective_from, courts(name)')
      .order('effective_from', { ascending: false })
      .limit(50)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRules((fresh ?? []).map((rule: any) => ({ ...rule, court_name: rule.courts?.name ?? '—' })))
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Pricing</h1>

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
            <label className="mb-1 block text-sm font-medium text-text-primary">Price per hour (₱)</label>
            <input type="number" step="0.01" min="1" value={pricePerHour}
              onChange={e => setPricePerHour(e.target.value)} required
              className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Deposit amount (₱)</label>
            <input type="number" step="0.01" min="0" value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)} required
              className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Effective from</label>
          <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} required
            className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#276749]" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-[#F2FAF5] p-3 text-sm font-semibold text-[#276749]">{success}</p>}

        <Button type="submit" loading={submitting} className="w-full">Save pricing rule</Button>
      </form>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Pricing history
      </h2>

      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && rules.map((r, i) => (
        <div key={r.id} className="mb-2 flex items-center justify-between rounded-xl border border-brand-border bg-white p-4">
          <div>
            <p className="font-semibold text-text-primary">{r.court_name}</p>
            <p className="text-sm text-text-muted">
              {fmtPHP(r.price_per_hour)}/hr · Deposit {fmtPHP(r.deposit_amount)}
            </p>
            <p className="text-xs text-text-muted">From {r.effective_from}</p>
          </div>
          {i === 0 || rules[i - 1]?.court_id !== r.court_id ? (
            <span className="rounded-full bg-[#276749] px-2 py-0.5 text-xs font-semibold text-white">Current</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
