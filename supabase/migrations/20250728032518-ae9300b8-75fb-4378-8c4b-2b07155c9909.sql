-- Remove the problematic view completely 
DROP VIEW IF EXISTS today_leaderboard;

-- Instead, let's optimize by creating better indexes only
-- Create optimized partial indexes for today's data
CREATE INDEX IF NOT EXISTS idx_daily_scores_today ON daily_scores(guesses_count, completion_time) 
WHERE word_date = CURRENT_DATE;

-- Create optimized composite index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_daily_scores_leaderboard_optimized ON daily_scores(word_date, guesses_count, completion_time, user_id);

-- Add database-level performance settings that are transaction-safe
SET statement_timeout = '30s';
SET lock_timeout = '10s';
SET idle_in_transaction_session_timeout = '60s';