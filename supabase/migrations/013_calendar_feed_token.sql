-- Per-user secret for subscribing to the team calendar from Google / Apple.
--
-- Calendar clients cannot log in, so the URL itself is the credential. It is
-- generated on request rather than for everyone up front, and can be rotated
-- to cut off a leaked link.

ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_feed_token UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_calendar_feed_token
  ON users(calendar_feed_token)
  WHERE calendar_feed_token IS NOT NULL;
