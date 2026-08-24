-- =============================================================================
-- Beanstalk Dink — Seed Data
-- Migration: 20260824000003_seed
--
-- Seeds: 1 organization · 1 venue · 2 courts · operating hours · pricing
-- All IDs are fixed UUIDs so subsequent migrations can reference them safely.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Organization
-- ---------------------------------------------------------------------------

INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Beanstalk Dink');

-- ---------------------------------------------------------------------------
-- Venue
-- ---------------------------------------------------------------------------

INSERT INTO venues (id, organization_id, name, address, timezone)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Beanstalk Dink',
  'Marilao, Bulacan',
  'Asia/Manila'
);

-- ---------------------------------------------------------------------------
-- Courts
-- Names from DB — never hard-coded in the frontend
-- ---------------------------------------------------------------------------

INSERT INTO courts (id, venue_id, name)
VALUES
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Court One'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Court Two');

-- ---------------------------------------------------------------------------
-- Operating hours
-- Mon–Sun (all 7 days): 08:00 – 00:00 (midnight next day)
-- day_of_week: 0 = Sunday, 1 = Monday … 6 = Saturday
-- ---------------------------------------------------------------------------

INSERT INTO operating_hours (venue_id, day_of_week, open_time, close_time, closes_next_day)
SELECT
  '00000000-0000-0000-0000-000000000002',
  gs.day,
  '08:00'::time,
  '00:00'::time,
  true              -- close_time '00:00' is midnight of the NEXT day
FROM generate_series(0, 6) AS gs(day);

-- ---------------------------------------------------------------------------
-- Venue settings
-- ---------------------------------------------------------------------------

INSERT INTO venue_settings (
  venue_id,
  booking_window_days,
  min_advance_minutes,
  hold_duration_minutes,
  slot_duration_minutes
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  30,   -- customers can book up to 30 days ahead
  60,   -- minimum 1 hour advance notice
  10,   -- hold expires after 10 minutes if payment not completed
  60    -- default 1-hour slots (engine supports future multi-hour)
);

-- ---------------------------------------------------------------------------
-- Cancellation policy
-- ---------------------------------------------------------------------------

INSERT INTO cancellation_policy (
  venue_id,
  refund_window_hours,
  no_show_forfeits_deposit,
  venue_cancellation_refund
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  24,    -- cancel 24h+ before = full deposit refund
  true,  -- no-show = deposit forfeited
  true   -- venue cancels = full refund
);

-- ---------------------------------------------------------------------------
-- Pricing rules
-- ₱500/hour = 50000 centavos | ₱100 deposit = 10000 centavos
-- ---------------------------------------------------------------------------

INSERT INTO pricing_rules (court_id, price_per_hour, deposit_amount, effective_from)
VALUES
  ('00000000-0000-0000-0000-000000000003', 50000, 10000, '2026-01-01'),
  ('00000000-0000-0000-0000-000000000004', 50000, 10000, '2026-01-01');

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
-- Admin account: created via Supabase Dashboard → Authentication → Invite user
--   Email: johnedward3101@gmail.com
--   After first login, the handle_new_admin_user() trigger automatically
--   creates the profile with role = 'admin'.
--
-- To change pricing: INSERT a new pricing_rules row with a future effective_from.
-- To change hours:   UPDATE operating_hours for the relevant day_of_week.
-- To change hold:    UPDATE venue_settings.hold_duration_minutes.
