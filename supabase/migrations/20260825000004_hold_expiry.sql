-- =============================================================================
-- Beanstalk Dink — Hold Expiry
-- Migration: 20260825000004_hold_expiry
--
-- Sets up pg_cron to expire stale HELD bookings every minute.
-- pg_cron is available on Supabase Pro. On Free tier, the expire-holds Edge
-- Function can be called manually or the lazy expiry in get-availability covers it.
-- =============================================================================

-- enable pg_cron (no-op if already enabled; silently continues on Free tier)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- SQL-level expire function (also called by the cron job below)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION expire_stale_holds()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH expired AS (
    UPDATE bookings
    SET status = 'expired', updated_at = now()
    WHERE status = 'held'
      AND hold_expires_at < now()
    RETURNING id
  )
  SELECT count(*)::integer FROM expired;
$$;

-- ---------------------------------------------------------------------------
-- pg_cron schedule: run every minute
-- If pg_cron is not available (Free tier), this block will fail gracefully.
-- Remove or comment out if running on Free tier without pg_cron.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  PERFORM cron.schedule(
    'beanstalk-expire-holds',
    '* * * * *',
    'SELECT expire_stale_holds()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available — hold expiry must be triggered via Edge Function. Error: %', SQLERRM;
END;
$$;
