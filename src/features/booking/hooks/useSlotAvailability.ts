import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import type { TimeSlot } from '../types'

// ── Pure helpers ──────────────────────────────────────────────────────────────
// Exported for unit testing. Do not call Edge Functions here.

function parseMinutes(t: string): number {
  const parts = t.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * Generate slots from open_time to close_time at slotMinutes intervals.
 * Enforces the slot boundary: a slot is only generated if it ends by closeMin.
 * Midnight close (closes_next_day=true) is treated as minute 1440.
 */
export function generateSlots(
  openTime: string,
  closeTime: string,
  closesNextDay: boolean,
  slotMinutes: number,
): TimeSlot[] {
  const openMin = parseMinutes(openTime)
  const closeMin = closesNextDay ? 24 * 60 : parseMinutes(closeTime)

  const slots: TimeSlot[] = []
  let cursor = openMin

  while (cursor + slotMinutes <= closeMin) {
    const endCursor = cursor + slotMinutes
    const fmtStart = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`
    const fmtEnd =
      endCursor === 1440
        ? '00:00'
        : `${String(Math.floor(endCursor / 60)).padStart(2, '0')}:${String(endCursor % 60).padStart(2, '0')}`

    slots.push({ startTime: fmtStart, endTime: fmtEnd, isAvailable: true })
    cursor += slotMinutes
  }

  return slots
}

// ── Edge Function hook ────────────────────────────────────────────────────────
// Calls get-availability Edge Function for server-authoritative slot availability.
// Replaces the Phase 3 client-side stub.

interface Params {
  date: string | null
  courtId: string | null
}

interface State {
  slots: TimeSlot[]
  loading: boolean
  error: string | null
}

export function useCourtAvailability({ date, courtId }: Params): State {
  const [state, setState] = useState<State>({ slots: [], loading: false, error: null })

  useEffect(() => {
    if (!date || !courtId) {
      setState({ slots: [], loading: false, error: null })
      return
    }

    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    supabase.functions
      .invoke('get-availability', { body: { court_id: courtId, date } })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setState({ slots: [], loading: false, error: error.message })
          return
        }
        const raw = (data?.slots ?? []) as { start_time: string; end_time: string; is_available: boolean }[]
        setState({
          slots: raw.map(s => ({
            startTime: s.start_time,
            endTime: s.end_time,
            isAvailable: s.is_available,
          })),
          loading: false,
          error: null,
        })
      })

    return () => { cancelled = true }
  }, [date, courtId])

  return state
}
