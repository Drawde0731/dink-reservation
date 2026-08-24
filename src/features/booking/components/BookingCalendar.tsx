import { useState } from 'react'
import { cn } from '../../../lib/cn'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getTodayManila(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

interface Props {
  selectedDate: string | null
  onDateSelect: (date: string) => void
  maxDate: string  // 'YYYY-MM-DD'
}

export function BookingCalendar({ selectedDate, onDateSelect, maxDate }: Props) {
  const today = getTodayManila()
  const [year, month] = (() => {
    // Start the calendar on the month of the selected date, or today's month
    const d = selectedDate ?? today
    return [parseInt(d.slice(0, 4), 10), parseInt(d.slice(5, 7), 10) - 1]
  })()

  const [viewYear, setViewYear] = useState(year)
  const [viewMonth, setViewMonth] = useState(month)

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDow = firstDayOfMonth(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Disable prev if current month is this month (can't go to past)
  const canGoPrev = !(
    viewYear === parseInt(today.slice(0, 4), 10) &&
    viewMonth === parseInt(today.slice(5, 7), 10) - 1
  )

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
            canGoPrev
              ? 'hover:bg-brand-surface text-text-primary'
              : 'text-brand-disabled cursor-not-allowed',
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-semibold text-text-primary">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-brand-surface text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day of week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Empty cells before first day */}
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1
          const dateStr = toDateString(viewYear, viewMonth, day)
          const isToday = dateStr === today
          const isPast = dateStr < today
          const isBeyondWindow = dateStr > maxDate
          const isSelected = dateStr === selectedDate
          const isDisabled = isPast || isBeyondWindow

          return (
            <button
              key={day}
              type="button"
              onClick={() => !isDisabled && onDateSelect(dateStr)}
              disabled={isDisabled}
              aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}${isToday ? ' (today)' : ''}${isSelected ? ', selected' : ''}`}
              aria-pressed={isSelected}
              className={cn(
                'relative w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                isSelected && 'bg-brand-green-dark text-white',
                !isSelected && !isDisabled && isToday && 'bg-brand-surface text-brand-green-dark ring-1 ring-brand-green-dark hover:bg-brand-green-dark hover:text-white',
                !isSelected && !isDisabled && !isToday && 'hover:bg-brand-surface text-text-primary',
                isDisabled && 'text-brand-disabled cursor-not-allowed',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
