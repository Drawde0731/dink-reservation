import { useMemo } from 'react'
import type { OperatingHoursRow, TimeSlot } from '../types'

// ponytail: Phase 3 generates slots client-side from operating hours only.
// No conflict checking — bookings table has no anon read policy.
// Phase 4 replaces this with an Edge Function call that returns authoritative
// availability (server-side conflict checking via the DB exclusion constraint).

function parseTime(t: string): number {
  // '08:00' or '08:00:00' → minutes since midnight
  const parts = t.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

export function generateSlots(
  openTime: string,
  closeTime: string,
  closesNextDay: boolean,
  slotMinutes: number,
): TimeSlot[] {
  const openMin = parseTime(openTime)
  // midnight treated as 24*60 = 1440 when closes_next_day is true
  const closeMin = closesNextDay ? 24 * 60 : parseTime(closeTime)

  const slots: TimeSlot[] = []
  let cursor = openMin

  while (cursor + slotMinutes <= closeMin) {
    const endCursor = cursor + slotMinutes
    const fmtStart = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`
    const fmtEnd = endCursor === 1440
      ? '00:00'
      : `${String(Math.floor(endCursor / 60)).padStart(2, '0')}:${String(endCursor % 60).padStart(2, '0')}`

    slots.push({ startTime: fmtStart, endTime: fmtEnd, isAvailable: true })
    cursor += slotMinutes
  }

  return slots
}

interface Params {
  date: string | null
  hoursRows: OperatingHoursRow[]
  slotDurationMinutes: number
  minAdvanceMinutes: number
}

export function useSlotAvailability({ date, hoursRows, slotDurationMinutes, minAdvanceMinutes }: Params) {
  return useMemo<TimeSlot[]>(() => {
    if (!date || hoursRows.length === 0) return []

    const jsDate = new Date(date + 'T00:00:00')
    const dayOfWeek = jsDate.getDay()  // 0=Sun, which matches DB schema

    const hoursRow = hoursRows.find(h => h.day_of_week === dayOfWeek)
    if (!hoursRow || hoursRow.is_closed) return []

    const allSlots = generateSlots(
      hoursRow.open_time,
      hoursRow.close_time,
      hoursRow.closes_next_day,
      slotDurationMinutes,
    )

    // Hide slots that start within min_advance_minutes from now
    const nowManila = new Date(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date()).replace(/(\d+)\/(\d+)\/(\d+),\s*(\d+):(\d+)/, '$3-$1-$2T$4:$5'),
    )

    const todayManila = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
    if (date !== todayManila) return allSlots

    // For today: filter out past slots + slots within min advance window
    const nowMinutes = nowManila.getHours() * 60 + nowManila.getMinutes() + minAdvanceMinutes
    return allSlots.filter(slot => parseTime(slot.startTime) >= nowMinutes)
  }, [date, hoursRows, slotDurationMinutes, minAdvanceMinutes])
}
