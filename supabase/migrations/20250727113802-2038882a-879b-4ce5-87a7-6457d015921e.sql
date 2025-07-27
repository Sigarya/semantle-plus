-- Create optimized database functions for better performance
CREATE OR REPLACE FUNCTION get_user_daily_score(user_uuid uuid, target_date date)
RETURNS TABLE(guesses_count integer, completion_time timestamp with time zone)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ds.guesses_count, ds.completion_time
  FROM daily_scores ds
  WHERE ds.user_id = user_uuid AND ds.word_date = target_date
  LIMIT 1;
$$;

-- Optimized function to get leaderboard for a specific date
CREATE OR REPLACE FUNCTION get_leaderboard_for_date(target_date date)
RETURNS TABLE(
  username text,
  user_id uuid,
  guesses_count integer,
  completion_time timestamp with time zone,
  rank bigint
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.username,
    ds.user_id,
    ds.guesses_count,
    ds.completion_time,
    ROW_NUMBER() OVER (ORDER BY ds.guesses_count ASC, ds.completion_time ASC) as rank
  FROM daily_scores ds
  JOIN profiles p ON p.id = ds.user_id
  WHERE ds.word_date = target_date
  ORDER BY ds.guesses_count ASC, ds.completion_time ASC;
$$;

-- Create function to get active word for date
CREATE OR REPLACE FUNCTION get_active_word_for_date(target_date date)
RETURNS TABLE(word text, hints text[])
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT dw.word, dw.hints
  FROM daily_words dw
  WHERE dw.date = target_date AND dw.is_active = true
  LIMIT 1;
$$;

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_scores_composite ON daily_scores(word_date, guesses_count, completion_time);
CREATE INDEX IF NOT EXISTS idx_user_guesses_composite ON user_guesses(user_id, word_date, guess_order);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add materialized view for leaderboard performance (optional for large datasets)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_leaderboards AS
SELECT 
  ds.word_date,
  p.username,
  ds.user_id,
  ds.guesses_count,
  ds.completion_time,
  ROW_NUMBER() OVER (PARTITION BY ds.word_date ORDER BY ds.guesses_count ASC, ds.completion_time ASC) as rank
FROM daily_scores ds
JOIN profiles p ON p.id = ds.user_id
ORDER BY ds.word_date DESC, ds.guesses_count ASC, ds.completion_time ASC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_leaderboards_unique ON daily_leaderboards(word_date, user_id);

-- Function to refresh materialized view (call this when scores are updated)
CREATE OR REPLACE FUNCTION refresh_daily_leaderboards()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_leaderboards;
$$;

-- Trigger to automatically refresh leaderboard when scores change
CREATE OR REPLACE FUNCTION trigger_refresh_leaderboards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pg_notify to trigger async refresh
  PERFORM pg_notify('refresh_leaderboards', NEW.word_date::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_leaderboards_on_score_change ON daily_scores;
CREATE TRIGGER refresh_leaderboards_on_score_change
  AFTER INSERT OR UPDATE ON daily_scores
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_leaderboards();