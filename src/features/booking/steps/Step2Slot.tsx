import { Button } from '../../../components/ui/Button'
import { CourtSlotSection } from '../components/CourtSlotSection'
import type { SlotSelection, CourtRow, PricingRuleRow, VenueSettingsRow } from '../types'
import { formatPHP } from '../../../lib/constants'

interface Props {
  date: string | null
  selections: SlotSelection[]
  courts: CourtRow[]
  pricing: PricingRuleRow[]
  settings: VenueSettingsRow
  onToggleSlot: (courtId: string, courtName: string, startTime: string, endTime: string) => void
  onNext: () => void
  onBack: () => void
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

// Group raw individual slots by court and compute per-court summary
function groupByCourt(selections: SlotSelection[], pricing: PricingRuleRow[]) {
  const map = new Map<string, { courtName: string; slots: SlotSelection[]; rule?: PricingRuleRow }>()
  for (const s of selections) {
    const entry = map.get(s.courtId) ?? { courtName: s.courtName, slots: [], rule: pricing.find(p => p.court_id === s.courtId) }
    entry.slots.push(s)
    map.set(s.courtId, entry)
  }
  return [...map.values()]
}

export function Step2Slot({ date, selections, courts, pricing, onToggleSlot, onNext, onBack }: Props) {
  const canContinue = selections.length > 0
  const grouped = groupByCourt(selections, pricing)

  // Deposit is per court (flat ₱100), not per hour
  const totalDeposit = grouped.reduce((sum, g) => sum + (g.rule?.deposit_amount ?? 10000), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Choose a Court &amp; Time</h2>
        {date && (
          <p className="text-sm text-text-muted mt-1">{formatDisplayDate(date)}</p>
        )}
        <p className="text-xs text-text-muted mt-0.5">
          Tap multiple slots to book multiple hours (e.g. 3 PM, 4 PM, 5 PM = 3-hour block).
          You can also book both courts at the same time.
        </p>
      </div>

      {courts.map((court) => (
        <CourtSlotSection
          key={court.id}
          court={court}
          date={date}
          pricing={pricing}
          selections={selections}
          onToggleSlot={onToggleSlot}
        />
      ))}

      {grouped.length > 0 && (
        <div className="rounded-xl bg-[#F2FAF5] border border-[#D4E8DB] px-4 py-3 text-sm">
          <p className="font-semibold text-[#276749]">
            {grouped.map(g => `${g.courtName}: ${g.slots.length} ${g.slots.length === 1 ? 'hr' : 'hrs'}`).join(' · ')}
          </p>
          {grouped.map(g => {
            const hrs = g.slots.length
            const fee = g.rule ? g.rule.price_per_hour * hrs : 0
            return (
              <p key={g.courtName} className="text-text-muted mt-0.5">
                {g.courtName} · {formatPHP(fee)} court fee · {formatPHP(g.rule?.deposit_amount ?? 10000)} deposit
              </p>
            )
          })}
          {grouped.length > 1 && (
            <p className="mt-1 font-medium text-text-primary">
              Total deposit: {formatPHP(totalDeposit)}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-text-muted text-center">
        Slots are held for 10 minutes after you start checkout — complete payment to confirm.
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
          className="flex-1"
        >
          Next: Your Details
        </Button>
      </div>
    </div>
  )
}
