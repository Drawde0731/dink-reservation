import { Button } from '../../../components/ui/Button'
import { TimeSlotButton } from '../components/TimeSlotButton'
import { useSlotAvailability } from '../hooks/useSlotAvailability'
import type { BookingSelection, CourtRow, OperatingHoursRow, PricingRuleRow, VenueSettingsRow } from '../types'
import { formatPHP } from '../../../lib/constants'

interface Props {
  selection: BookingSelection
  courts: CourtRow[]
  pricing: PricingRuleRow[]
  hours: OperatingHoursRow[]
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

export function Step2Slot({ selection, courts, pricing, hours, settings, onUpdate, onNext, onBack }: Props) {
  const slots = useSlotAvailability({
    date: selection.date,
    hoursRows: hours,
    slotDurationMinutes: settings.slot_duration_minutes,
    minAdvanceMinutes: settings.min_advance_minutes,
  })

  const activePricing = (courtId: string) =>
    pricing.find(p => p.court_id === courtId)

  function selectSlot(court: CourtRow, startTime: string, endTime: string) {
    onUpdate({
      courtId: court.id,
      courtName: court.name,
      startTime,
      endTime,
      durationMinutes: settings.slot_duration_minutes,
    })
  }

  const isSlotSelected = (courtId: string, startTime: string) =>
    selection.courtId === courtId && selection.startTime === startTime

  const canContinue = !!selection.courtId && !!selection.startTime

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Choose a Court & Time</h2>
        {selection.date && (
          <p className="text-sm text-text-muted mt-1">{formatDisplayDate(selection.date)}</p>
        )}
      </div>

      {slots.length === 0 && (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-6 text-center">
          <p className="text-text-muted text-sm">No available slots for this date.</p>
          <button
            type="button"
            className="mt-2 text-sm text-brand-green-dark underline"
            onClick={onBack}
          >
            Choose a different date
          </button>
        </div>
      )}

      {courts.map((court) => {
        const rule = activePricing(court.id)

        return (
          <div key={court.id} className="rounded-xl border border-brand-border overflow-hidden">
            {/* Court header */}
            <div className="bg-brand-surface px-4 py-3 flex items-center justify-between border-b border-brand-border">
              <div>
                <h3 className="font-semibold text-text-primary">{court.name}</h3>
                {rule && (
                  <p className="text-xs text-text-muted">{formatPHP(rule.price_per_hour)} / hour</p>
                )}
              </div>
              {selection.courtId === court.id && selection.courtName && (
                <span className="text-xs font-medium text-brand-green-dark bg-brand-green-light/30 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>

            {/* Slot grid */}
            {slots.length > 0 ? (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <TimeSlotButton
                    key={slot.startTime}
                    startTime={slot.startTime}
                    endTime={slot.endTime}
                    isAvailable={slot.isAvailable}
                    isSelected={isSlotSelected(court.id, slot.startTime)}
                    onSelect={() => selectSlot(court, slot.startTime, slot.endTime)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-text-muted text-center">No slots today</div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-text-muted text-center">
        Slots are held for 10 minutes after booking — complete payment to confirm.
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
