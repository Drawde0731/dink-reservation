-- =============================================================================
-- Beanstalk Dink — Row Level Security Policies
-- Migration: 20260824000002_rls_policies
-- =============================================================================
-- Design:
--   anon  (customers, public)  — read-only on public data; no writes
--   authenticated (admins)     — full access within their organization
--   service_role (Edge Fns)    — bypasses RLS; handles all booking/payment writes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------

ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues              ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours     ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: is the current authenticated user an active admin?
-- SECURITY DEFINER so it reads profiles table regardless of RLS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- Only admins can read/write. No public access.
-- ---------------------------------------------------------------------------

CREATE POLICY "org_admin_all"
  ON organizations FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- venues
-- Public can read active venues (for display).
-- Admins can do everything.
-- ---------------------------------------------------------------------------

CREATE POLICY "venues_public_select"
  ON venues FOR SELECT
  USING (is_active = true);

CREATE POLICY "venues_admin_all"
  ON venues FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- courts
-- Public can read active courts (slot display).
-- Admins can do everything.
-- ---------------------------------------------------------------------------

CREATE POLICY "courts_public_select"
  ON courts FOR SELECT
  USING (is_active = true);

CREATE POLICY "courts_admin_all"
  ON courts FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- operating_hours
-- Public can read (calendar needs it for available days).
-- Admins can do everything.
-- ---------------------------------------------------------------------------

CREATE POLICY "operating_hours_public_select"
  ON operating_hours FOR SELECT
  USING (true);

CREATE POLICY "operating_hours_admin_all"
  ON operating_hours FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- venue_settings
-- Public can read (booking engine needs window + hold duration config).
-- Admins can do everything.
-- ---------------------------------------------------------------------------

CREATE POLICY "venue_settings_public_select"
  ON venue_settings FOR SELECT
  USING (true);

CREATE POLICY "venue_settings_admin_all"
  ON venue_settings FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- cancellation_policy
-- Public can read (displayed on cancellation policy page and checkout).
-- Admins can do everything.
-- ---------------------------------------------------------------------------

CREATE POLICY "cancellation_policy_public_select"
  ON cancellation_policy FOR SELECT
  USING (true);

CREATE POLICY "cancellation_policy_admin_all"
  ON cancellation_policy FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- pricing_rules
-- Public can read (pricing shown before checkout).
-- Admins can do everything.
-- ---------------------------------------------------------------------------

CREATE POLICY "pricing_rules_public_select"
  ON pricing_rules FOR SELECT
  USING (true);

CREATE POLICY "pricing_rules_admin_all"
  ON pricing_rules FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- blocked_times
-- Public can read (blocked slots shown as unavailable in calendar).
-- Admins can do everything.
-- ---------------------------------------------------------------------------

CREATE POLICY "blocked_times_public_select"
  ON blocked_times FOR SELECT
  USING (true);

CREATE POLICY "blocked_times_admin_all"
  ON blocked_times FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- Admins can read and update their own profile only.
-- No public access.
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_own_select"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_own_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- bookings
-- No public direct access. Customers interact via Edge Functions (service role).
-- Admins can read and write all bookings.
-- ---------------------------------------------------------------------------

CREATE POLICY "bookings_admin_all"
  ON bookings FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- payments
-- No public access. All writes via Edge Functions (service role).
-- Admins can read.
-- ---------------------------------------------------------------------------

CREATE POLICY "payments_admin_select"
  ON payments FOR SELECT
  USING (is_admin());

CREATE POLICY "payments_admin_update"
  ON payments FOR UPDATE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs
-- Admins can SELECT only. INSERT is via Edge Functions (service role).
-- No UPDATE or DELETE for anyone — audit logs are immutable.
-- ---------------------------------------------------------------------------

CREATE POLICY "audit_logs_admin_select"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- notifications
-- No public access. All operations via Edge Functions (service role).
-- Admins can read for troubleshooting.
-- ---------------------------------------------------------------------------

CREATE POLICY "notifications_admin_select"
  ON notifications FOR SELECT
  USING (is_admin());
