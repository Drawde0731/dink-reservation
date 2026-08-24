-- =============================================================================
-- Beanstalk Dink — pg_cron schedule for send-notifications
-- Migration: 20260825000006_send_notifications_cron
--
-- Calls the send-notifications Edge Function every minute so the
-- notification queue is processed promptly after PayMongo confirms payment.
--
-- pg_cron is available on Supabase Pro and above. On Free tier it is absent
-- but Supabase also supports pg_net + cron through the dashboard, or the
-- function can be invoked manually / via GitHub Actions. The DO block below
-- installs the cron job gracefully if pg_cron is available and skips silently
-- otherwise — no migration failure on Free tier.
-- =============================================================================

DO $$
DECLARE
  v_supabase_url text;
  v_service_key  text;
BEGIN
  -- Attempt to schedule only if pg_cron extension is present
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove any previous schedule of the same name (idempotent re-run)
    PERFORM cron.unschedule('send-notifications')
      WHERE EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'send-notifications'
      );

    -- The SUPABASE_URL and SERVICE_ROLE_KEY values are read from Supabase
    -- Vault secrets at cron-job creation time via the net extension.
    -- If Vault secrets are not configured, substitute your project values here.
    PERFORM cron.schedule(
      'send-notifications',
      '* * * * *',   -- every minute
      $$
        SELECT net.http_post(
          url  := current_setting('app.supabase_url', true) || '/functions/v1/send-notifications',
          headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
          ),
          body := '{}'::jsonb
        )
      $$
    );

    RAISE NOTICE 'pg_cron job "send-notifications" scheduled (every minute).';
  ELSE
    RAISE NOTICE 'pg_cron not available — send-notifications cron skipped. '
                 'Trigger the function manually or via Supabase dashboard scheduled functions.';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Alternative: pg_net one-shot helper (useful for testing without pg_cron)
-- ---------------------------------------------------------------------------
-- SELECT net.http_post(
--   url     := '<your-project-ref>.supabase.co/functions/v1/send-notifications',
--   headers := '{"Content-Type":"application/json","Authorization":"Bearer <service-role-key>"}'::jsonb,
--   body    := '{}'::jsonb
-- );
