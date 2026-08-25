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

export function Step2Slot({ date, selections, courts, pricing, onToggleSlot, onNext, onBack }: Props) {
  const canContinue = selections.length > 0

  // Total deposit across all selected slots
  const totalDeposit = selections.reduce((sum, sel) => {
    const rule = pricing.find(p => p.court_id === sel.courtId)
    return sum + (rule?.deposit_amount ?? 10000)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Choose a Court &amp; Time</h2>
        {date && (
          <p className="text-sm text-text-muted mt-1">{formatDisplayDate(date)}</p>
        )}
        <p className="text-xs text-text-muted mt-0.5">
          You can book both courts at the same time — tap a slot on each court.
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

      {selections.length > 0 && (
        <div className="rounded-xl bg-[#F2FAF5] border border-[#D4E8DB] px-4 py-3 text-sm">
          <p className="font-semibold text-[#276749]">
            {selections.length === 1 ? '1 court selected' : `${selections.length} courts selected`}
          </p>
          {selections.map(s => {
            const rule = pricing.find(p => p.court_id === s.courtId)
            return (
              <p key={s.courtId} className="text-text-muted mt-0.5">
                {s.courtName} · {s.startTime} – {s.endTime}
                {rule ? ` · ${formatPHP(rule.deposit_amount)} deposit` : ''}
              </p>
            )
          })}
          {selections.length > 1 && (
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
