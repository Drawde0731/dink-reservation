import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { TimeSlotButton } from './TimeSlotButton'
import { useCourtAvailability } from '../hooks/useSlotAvailability'
import type { BookingSelection, CourtRow, PricingRuleRow } from '../types'
import { formatPHP } from '../../../lib/constants'

interface Props {
  court: CourtRow
  date: string | null
  pricing: PricingRuleRow[]
  selection: BookingSelection
  onSelectSlot: (courtId: string, courtName: string, startTime: string, endTime: string) => void
}

export function CourtSlotSection({ court, date, pricing, selection, onSelectSlot }: Props) {
  const { slots, loading, error } = useCourtAvailability({ date, courtId: court.id })

  const rule = pricing.find(p => p.court_id === court.id)
  const isCourtSelected = selection.courtId === court.id

  return (
    <div className="rounded-xl border border-brand-border overflow-hidden">
      {/* Court header */}
      <div className="bg-brand-surface px-4 py-3 flex items-center justify-between border-b border-brand-border">
        <div>
          <h3 className="font-semibold text-text-primary">{court.name}</h3>
          {rule && (
            <p className="text-xs text-text-muted">{formatPHP(rule.price_per_hour)} / hour</p>
          )}
        </div>
        {isCourtSelected && selection.startTime && (
          <span className="text-xs font-medium text-brand-green-dark bg-brand-green-light/30 px-2 py-0.5 rounded-full">
            Selected
          </span>
        )}
      </div>

      {/* Slot content */}
      <div className="p-4">
        {loading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner label={`Loading ${court.name} availability…`} />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600 text-center py-2">
            Couldn't load availability. Check your connection.
          </p>
        )}

        {!loading && !error && slots.length === 0 && (
          <p className="text-sm text-text-muted text-center py-2">No available slots for this date.</p>
        )}

        {!loading && !error && slots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot) => (
              <TimeSlotButton
                key={slot.startTime}
                startTime={slot.startTime}
                endTime={slot.endTime}
                isAvailable={slot.isAvailable}
                isSelected={isCourtSelected && selection.startTime === slot.startTime}
                onSelect={() => onSelectSlot(court.id, court.name, slot.startTime, slot.endTime)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
