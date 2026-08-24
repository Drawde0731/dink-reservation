import { cn } from '../../../lib/cn'

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

interface Props {
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
  isAvailable: boolean
  isSelected: boolean
  onSelect: () => void
}

export function TimeSlotButton({ startTime, endTime, isAvailable, isSelected, onSelect }: Props) {
  const label = `${formatTime(startTime)} – ${formatTime(endTime)}`

  if (!isAvailable) {
    return (
      <div
        aria-label={`${label}, unavailable`}
        className="px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-text-muted text-sm text-center cursor-not-allowed select-none"
      >
        {label}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${label}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
      className={cn(
        'px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center',
        isSelected
          ? 'bg-brand-green-dark border-brand-green-dark text-white shadow-sm'
          : 'border-brand-border bg-white text-text-primary hover:border-brand-green-dark hover:bg-brand-surface',
      )}
    >
      {label}
    </button>
  )
}
