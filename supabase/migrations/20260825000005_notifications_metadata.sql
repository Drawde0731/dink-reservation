-- =============================================================================
-- Beanstalk Dink — Add metadata to notifications
-- Migration: 20260825000005_notifications_metadata
--
-- Stores per-notification data needed at send time (e.g. encrypted management
-- token for the confirmation email manage URL).
-- =============================================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata jsonb;
