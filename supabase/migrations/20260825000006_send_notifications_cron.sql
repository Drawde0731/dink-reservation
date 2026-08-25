-- =============================================================================
-- Beanstalk Dink — pg_cron schedule for send-notifications
-- Migration: 20260825000006_send_notifications_cron
-- =============================================================================

DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove any previous schedule of the same name (idempotent re-run)
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-notifications') THEN
      PERFORM cron.unschedule('send-notifications');
    END IF;

    PERFORM cron.schedule(
      'send-notifications',
      '* * * * *',
      $cron$
        SELECT net.http_post(
          url     := current_setting('app.supabase_url', true) || '/functions/v1/send-notifications',
          headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
          ),
          body    := '{}'::jsonb
        )
      $cron$
    );

    RAISE NOTICE 'pg_cron job "send-notifications" scheduled (every minute).';
  ELSE
    RAISE NOTICE 'pg_cron not available — skipped. Trigger send-notifications manually or via Supabase dashboard.';
  END IF;
END;
$outer$;
