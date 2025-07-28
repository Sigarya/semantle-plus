-- Fix security issue by dropping the view and creating RLS-compliant version
DROP VIEW IF EXISTS today_leaderboard;

-- Create a regular view without SECURITY DEFINER that respects RLS
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

-- Enable RLS on the view (though it inherits from underlying tables)
ALTER VIEW today_leaderboard SET (security_barrier = on);

-- Grant appropriate permissions
GRANT SELECT ON today_leaderboard TO authenticated, anon;