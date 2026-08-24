import { Button } from '../../../components/ui/Button'
import { BookingCalendar } from '../components/BookingCalendar'
import type { BookingSelection, VenueSettingsRow } from '../types'

interface Props {
  selection: BookingSelection
  settings: VenueSettingsRow
  onUpdate: (partial: Partial<BookingSelection>) => void
  onNext: () => void
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d)
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function Step1Date({ selection, settings, onUpdate, onNext }: Props) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
  const maxDate = addDays(today, settings.booking_window_days)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Choose a Date</h2>
        <p className="text-sm text-text-muted mt-1">
          Courts are open every day · up to {settings.booking_window_days} days ahead
        </p>
      </div>

      <BookingCalendar
        selectedDate={selection.date}
        onDateSelect={(date) => onUpdate({ date })}
        maxDate={maxDate}
      />

      {selection.date && (
        <p className="text-sm text-center text-brand-green-dark font-medium">
          {formatDisplayDate(selection.date)}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!selection.date}
        onClick={onNext}
      >
        Next: Select Time →
      </Button>
    </div>
  )
}
