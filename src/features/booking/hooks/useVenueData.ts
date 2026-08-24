import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { SEED_IDS } from '../../../lib/constants'
import type {
  CourtRow,
  PricingRuleRow,
  OperatingHoursRow,
  VenueSettingsRow,
} from '../types'

export interface VenueData {
  courts: CourtRow[]
  pricing: PricingRuleRow[]       // one row per court (most recent)
  hours: OperatingHoursRow[]      // one row per day (0–6)
  settings: VenueSettingsRow | null
}

interface State {
  data: VenueData | null
  loading: boolean
  error: string | null
}

// Fetches all public venue data needed to drive the booking UI.
// All tables used here have anon SELECT policies.
export function useVenueData(): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

        const [courtsRes, pricingRes, hoursRes, settingsRes] = await Promise.all([
          supabase
            .from('courts')
            .select('id, name, is_active')
            .eq('venue_id', SEED_IDS.VENUE_ID)
            .eq('is_active', true)
            .order('name'),

          // Most recent pricing rule per court (effective_from <= today)
          supabase
            .from('pricing_rules')
            .select('court_id, price_per_hour, deposit_amount, effective_from')
            .lte('effective_from', today)
            .order('effective_from', { ascending: false }),

          supabase
            .from('operating_hours')
            .select('day_of_week, open_time, close_time, closes_next_day, is_closed')
            .eq('venue_id', SEED_IDS.VENUE_ID),

          supabase
            .from('venue_settings')
            .select('booking_window_days, min_advance_minutes, hold_duration_minutes, slot_duration_minutes')
            .eq('venue_id', SEED_IDS.VENUE_ID)
            .single(),
        ])

        if (courtsRes.error) throw courtsRes.error
        if (pricingRes.error) throw pricingRes.error
        if (hoursRes.error) throw hoursRes.error
        if (settingsRes.error) throw settingsRes.error

        // Deduplicate pricing: one row per court_id (highest effective_from wins)
        const seenCourts = new Set<string>()
        const pricing: PricingRuleRow[] = []
        for (const row of (pricingRes.data ?? [])) {
          if (!seenCourts.has(row.court_id)) {
            seenCourts.add(row.court_id)
            pricing.push(row as PricingRuleRow)
          }
        }

        if (!cancelled) {
          setState({
            data: {
              courts: (courtsRes.data ?? []) as CourtRow[],
              pricing,
              hours: (hoursRes.data ?? []) as OperatingHoursRow[],
              settings: settingsRes.data as VenueSettingsRow | null,
            },
            loading: false,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load venue data.',
          })
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  return state
}
