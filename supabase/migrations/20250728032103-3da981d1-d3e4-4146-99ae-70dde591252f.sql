-- Performance optimizations without ALTER SYSTEM commands
-- Add btree indexes for text searches (better than default)
CREATE INDEX IF NOT EXISTS idx_profiles_username_btree ON profiles USING btree(username);
CREATE INDEX IF NOT EXISTS idx_daily_words_word_btree ON daily_words USING btree(word);

-- Add partial indexes for active records only (better performance)
CREATE INDEX IF NOT EXISTS idx_daily_words_active_date ON daily_words(date) WHERE is_active = true;

-- Optimize user_guesses table with better indexing strategy
CREATE INDEX IF NOT EXISTS idx_user_guesses_performance ON user_guesses(user_id, word_date, similarity DESC, guess_order);

-- Add covering indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_daily_scores_covering ON daily_scores(word_date, guesses_count, completion_time) INCLUDE (user_id);

-- Create optimized indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_daily_scores_leaderboard ON daily_scores(word_date, guesses_count ASC, completion_time ASC);

-- Optimize table storage and statistics
ANALYZE profiles;
ANALYZE daily_words;
ANALYZE daily_scores;
ANALYZE user_guesses;
ANALYZE game_sessions;
ANALYZE user_stats;

-- Set up automatic statistics collection for better query planning
ALTER TABLE profiles SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE daily_scores SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE user_guesses SET (autovacuum_analyze_scale_factor = 0.02);

-- Create function to clean up old data for performance
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete audit logs older than 90 days
  DELETE FROM audit_logs WHERE change_time < NOW() - INTERVAL '90 days';
  
  -- Clean up old game sessions (keep last 30 days)
  DELETE FROM game_sessions WHERE started_at < NOW() - INTERVAL '30 days' AND is_finished = true;
  
  -- Update table statistics after cleanup
  ANALYZE audit_logs;
  ANALYZE game_sessions;
END;
$$;

-- Create function to refresh materialized view more efficiently
CREATE OR REPLACE FUNCTION refresh_leaderboards_for_date(target_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only refresh specific date data instead of entire view
  DELETE FROM daily_leaderboards WHERE word_date = target_date;
  
  INSERT INTO daily_leaderboards (word_date, username, user_id, guesses_count, completion_time, rank)
  SELECT 
    ds.word_date,
    p.username,
    ds.user_id,
    ds.guesses_count,
    ds.completion_time,
    ROW_NUMBER() OVER (ORDER BY ds.guesses_count ASC, ds.completion_time ASC) as rank
  FROM daily_scores ds
  JOIN profiles p ON p.id = ds.user_id
  WHERE ds.word_date = target_date
  ORDER BY ds.guesses_count ASC, ds.completion_time ASC;
END;
$$;

-- Create optimized view for quick access to today's leaderboard
CREATE OR REPLACE VIEW today_leaderboard AS
SELECT 
  p.username,
  ds.user_id,
  ds.guesses_count,
  ds.completion_time,
  ROW_NUMBER() OVER (ORDER BY ds.guesses_count ASC, ds.completion_time ASC) as rank
FROM daily_scores ds
JOIN profiles p ON p.id = ds.user_id
WHERE ds.word_date = CURRENT_DATE
ORDER BY ds.guesses_count ASC, ds.completion_time ASC;

-- Grant appropriate permissions
GRANT SELECT ON today_leaderboard TO authenticated;