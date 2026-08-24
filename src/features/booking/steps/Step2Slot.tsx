import { Button } from '../../../components/ui/Button'
import { CourtSlotSection } from '../components/CourtSlotSection'
import type { BookingSelection, CourtRow, PricingRuleRow, VenueSettingsRow } from '../types'

interface Props {
  selection: BookingSelection
  courts: CourtRow[]
  pricing: PricingRuleRow[]
  settings: VenueSettingsRow
  onUpdate: (partial: Partial<BookingSelection>) => void
  onNext: () => void
  onBack: () => void
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function Step2Slot({ selection, courts, pricing, onUpdate, onNext, onBack }: Props) {
  function selectSlot(courtId: string, courtName: string, startTime: string, endTime: string) {
    onUpdate({ courtId, courtName, startTime, endTime })
  }

  const canContinue = !!selection.courtId && !!selection.startTime

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Choose a Court & Time</h2>
        {selection.date && (
          <p className="text-sm text-text-muted mt-1">{formatDisplayDate(selection.date)}</p>
        )}
      </div>

      {courts.map((court) => (
        <CourtSlotSection
          key={court.id}
          court={court}
          date={selection.date}
          pricing={pricing}
          selection={selection}
          onSelectSlot={selectSlot}
        />
      ))}

      <p className="text-xs text-text-muted text-center">
        Slots are held for 10 minutes after you start checkout — complete payment to confirm.
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} className="flex-1">
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
          className="flex-1"
        >
          Next: Your Details →
        </Button>
      </div>
    </div>
  )
}
