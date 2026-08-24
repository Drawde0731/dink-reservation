-- =============================================================================
-- Beanstalk Dink — Initial Schema
-- Migration: 20260824000001_initial_schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- btree_gist: required for the booking overlap exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- pgcrypto: gen_random_uuid() — available by default in Supabase but explicit is better
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

CREATE TABLE organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE venues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name            text NOT NULL,
  address         text NOT NULL,
  timezone        text NOT NULL DEFAULT 'Asia/Manila',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   uuid NOT NULL REFERENCES venues(id),
  name       text NOT NULL,   -- e.g. 'Court One', 'Court Two'
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-venue, per-day-of-week operating hours
-- day_of_week: 0 = Sunday … 6 = Saturday
CREATE TABLE operating_hours (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id         uuid NOT NULL REFERENCES venues(id),
  day_of_week      smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time        time NOT NULL,
  close_time       time NOT NULL,
  -- true when close_time is '00:00' and means the next calendar day (midnight)
  closes_next_day  boolean NOT NULL DEFAULT false,
  is_closed        boolean NOT NULL DEFAULT false,
  UNIQUE (venue_id, day_of_week)
);

-- Configurable booking engine settings per venue
CREATE TABLE venue_settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                uuid NOT NULL REFERENCES venues(id) UNIQUE,
  booking_window_days     integer NOT NULL DEFAULT 30,   -- how far ahead customers can book
  min_advance_minutes     integer NOT NULL DEFAULT 60,   -- minimum minutes before session
  hold_duration_minutes   integer NOT NULL DEFAULT 10,   -- how long a HELD booking reserves the slot
  slot_duration_minutes   integer NOT NULL DEFAULT 60,   -- default slot length (V1 = 60 min)
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Configurable cancellation policy per venue
CREATE TABLE cancellation_policy (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                   uuid NOT NULL REFERENCES venues(id) UNIQUE,
  -- hours before the booking that entitle a customer to a full deposit refund
  refund_window_hours        integer NOT NULL DEFAULT 24,
  no_show_forfeits_deposit   boolean NOT NULL DEFAULT true,
  venue_cancellation_refund  boolean NOT NULL DEFAULT true,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- Pricing rules (per court; effective_from enables future price changes)
CREATE TABLE pricing_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id        uuid NOT NULL REFERENCES courts(id),
  price_per_hour  integer NOT NULL CHECK (price_per_hour > 0),  -- centavos
  deposit_amount  integer NOT NULL CHECK (deposit_amount > 0),  -- centavos
  effective_from  date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Admin / staff profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  organization_id uuid REFERENCES organizations(id),
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Court closures: maintenance, events, weather, etc.
CREATE TABLE blocked_times (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id   uuid NOT NULL REFERENCES courts(id),
  venue_id   uuid NOT NULL REFERENCES venues(id),
  start_at   timestamptz NOT NULL,  -- UTC
  end_at     timestamptz NOT NULL,  -- UTC
  reason     text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocked_times_order CHECK (end_at > start_at)
);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------

CREATE TABLE bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference     text NOT NULL UNIQUE,       -- 'BT-YYYYMMDDNNNN'
  venue_id              uuid NOT NULL REFERENCES venues(id),
  court_id              uuid NOT NULL REFERENCES courts(id),

  -- Customer info (collected at booking time; no customer account required)
  customer_name         text NOT NULL,
  customer_email        text NOT NULL,
  customer_phone        text NOT NULL,

  -- Time — stored in venue timezone for human readability
  booking_date          date NOT NULL,              -- Asia/Manila date
  start_time            time NOT NULL,              -- Asia/Manila start
  end_time              time NOT NULL,              -- Asia/Manila end ('00:00' = midnight next day)
  duration_minutes      integer NOT NULL CHECK (duration_minutes > 0),

  -- UTC timestamps — authoritative for overlap detection and hold expiry
  start_at              timestamptz NOT NULL,
  end_at                timestamptz NOT NULL,

  status                text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'held', 'confirmed', 'cancelled', 'completed', 'expired', 'no_show')
  ),
  hold_expires_at       timestamptz,               -- set when status = 'held'

  -- Customer management token: 32-byte random, bcrypt hash stored here
  -- Raw token sent to customer in confirmation email URL; never stored
  management_token_hash text,

  payment_method        text NOT NULL DEFAULT 'online_deposit' CHECK (
    payment_method IN ('online_deposit', 'cash_at_venue')
  ),

  cancellation_reason   text,
  cancelled_at          timestamptz,
  cancelled_by          uuid REFERENCES profiles(id),

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bookings_time_order CHECK (end_at > start_at)
);

-- ---------------------------------------------------------------------------
-- Payments (separate table from bookings)
-- ---------------------------------------------------------------------------

CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES bookings(id),
  provider            text NOT NULL DEFAULT 'paymongo' CHECK (provider IN ('paymongo')),
  -- NULL until PayMongo payment is created; UNIQUE prevents duplicate webhook processing
  provider_payment_id text UNIQUE,
  amount              integer NOT NULL CHECK (amount > 0),  -- centavos
  currency            text NOT NULL DEFAULT 'PHP',
  status              text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')
  ),
  payment_method      text NOT NULL DEFAULT 'online_deposit' CHECK (
    payment_method IN ('online_deposit', 'cash_at_venue')
  ),
  paid_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Audit log (immutable — Edge Functions insert via service role)
-- ---------------------------------------------------------------------------

CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES profiles(id),
  actor_email text NOT NULL,
  action      text NOT NULL,       -- e.g. 'booking.cancelled', 'court.blocked', 'pricing.changed'
  entity_type text NOT NULL,       -- e.g. 'booking', 'court', 'pricing_rule'
  entity_id   text,                -- UUID as text
  metadata    jsonb,               -- relevant snapshot (does not store secrets or payment data)
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Notifications (email queue — processed by Edge Function)
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid REFERENCES bookings(id),
  type            text NOT NULL CHECK (
    type IN ('confirmation', 'reminder', 'cancellation', 'venue_cancellation')
  ),
  recipient_email text NOT NULL,
  scheduled_at    timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  status          text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed')
  ),
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Booking reference sequence + generator
-- ---------------------------------------------------------------------------

CREATE SEQUENCE booking_reference_seq START 1;

-- Returns 'BT-YYYYMMDDNNNN' where date is in Asia/Manila and NNNN is a
-- global sequence (not per-day). Date shows when the booking was created.
-- ponytail: global sequence — if per-day reset is needed later, add a
-- date-keyed counter table.
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_date text;
  v_seq  integer;
BEGIN
  v_date := to_char(now() AT TIME ZONE 'Asia/Manila', 'YYYYMMDD');
  v_seq  := nextval('booking_reference_seq');
  RETURN 'BT-' || v_date || lpad(v_seq::text, 4, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- updated_at auto-maintenance trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_venue_settings_updated_at
  BEFORE UPDATE ON venue_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cancellation_policy_updated_at
  BEFORE UPDATE ON cancellation_policy
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile when admin is added to auth.users
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- ponytail: assumes single org; extend when multi-org is needed
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  INSERT INTO profiles (id, email, role, organization_id)
  VALUES (NEW.id, NEW.email, 'admin', v_org_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_admin_user();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Bookings
CREATE INDEX idx_bookings_court_date     ON bookings (court_id, booking_date);
CREATE INDEX idx_bookings_venue_date     ON bookings (venue_id, booking_date);
CREATE INDEX idx_bookings_status         ON bookings (status);
CREATE INDEX idx_bookings_hold_expires   ON bookings (hold_expires_at) WHERE status = 'held';
CREATE INDEX idx_bookings_customer_email ON bookings (customer_email);
CREATE INDEX idx_bookings_start_at       ON bookings (court_id, start_at);

-- Payments
CREATE INDEX idx_payments_booking        ON payments (booking_id);
CREATE INDEX idx_payments_provider_id    ON payments (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- Blocked times
CREATE INDEX idx_blocked_times_court     ON blocked_times (court_id, start_at, end_at);

-- Notifications
CREATE INDEX idx_notifications_scheduled ON notifications (scheduled_at, status)
  WHERE status = 'pending';

-- Pricing rules (get current rule for a court = max effective_from <= today)
CREATE INDEX idx_pricing_rules_court     ON pricing_rules (court_id, effective_from DESC);

-- ---------------------------------------------------------------------------
-- Booking overlap exclusion constraint
-- Prevents two non-cancelled/non-expired bookings from occupying the same
-- court at the same time. Uses UTC timestamptz range for accuracy across
-- midnight and timezone boundaries.
-- ---------------------------------------------------------------------------

ALTER TABLE bookings
  ADD CONSTRAINT no_booking_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'expired', 'no_show'));
