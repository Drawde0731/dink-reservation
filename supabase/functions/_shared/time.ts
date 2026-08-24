// Timezone helpers for Asia/Manila (UTC+8, no DST).
// All booking times are stored as UTC in the DB; Manila is the presentation timezone.

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000

/** Get current date in Manila as 'YYYY-MM-DD'. */
export function todayManila(): string {
  return new Date(Date.now() + MANILA_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
}

/**
 * Convert Manila date + 'HH:MM' time to a UTC Date.
 * When isNextDay=true (e.g. end_time '00:00' with closes_next_day), the date
 * is bumped by one before converting.
 */
export function manilaToUTC(date: string, time: string, isNextDay = false): Date {
  const [y, m, d] = date.split('-').map(Number)
  const nextDay = isNextDay ? d + 1 : d
  // Use fixed offset string; Manila never observes DST
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}T${time}:00+08:00`
  return new Date(iso)
}

/** Get day-of-week (0=Sun) for a 'YYYY-MM-DD' string in Manila timezone. */
export function dayOfWeekManila(date: string): number {
  // date is already Manila date, so parse it directly as local midnight Manila
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

/** Parse 'HH:MM' or 'HH:MM:SS' → total minutes since midnight. */
export function parseMinutes(t: string): number {
  const parts = t.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}
