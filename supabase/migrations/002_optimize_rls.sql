-- Optimize is_weeks_user() to read from JWT instead of querying auth.users table.
-- This eliminates a subquery on every RLS policy check across all tables.
-- STABLE tells PostgreSQL the result won't change within a single statement,
-- allowing it to cache the result instead of re-evaluating per row.

CREATE OR REPLACE FUNCTION is_weeks_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') LIKE '%@weeks.cz';
END;
$$ LANGUAGE plpgsql STABLE;
