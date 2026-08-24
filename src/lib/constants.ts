// Fixed seed IDs — match supabase/migrations/20260824000003_seed.sql
// These are used in Edge Functions and admin utilities to reference the
// initial venue. Do not change without updating the migration seed.
export const SEED_IDS = {
  ORGANIZATION_ID: '00000000-0000-0000-0000-000000000001',
  VENUE_ID:        '00000000-0000-0000-0000-000000000002',
  COURT_ONE_ID:    '00000000-0000-0000-0000-000000000003',
  COURT_TWO_ID:    '00000000-0000-0000-0000-000000000004',
} as const

// Venue timezone — all booking logic uses this; never use browser timezone
export const VENUE_TIMEZONE = 'Asia/Manila' as const

// Centavo helpers — prices stored in centavos throughout
export const toCentavos = (pesos: number) => Math.round(pesos * 100)
export const toPesos = (centavos: number) => centavos / 100
export const formatPHP = (centavos: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
    centavos / 100,
  )
