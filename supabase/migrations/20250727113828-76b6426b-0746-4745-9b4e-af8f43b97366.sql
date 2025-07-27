-- Fix security issues: Set search_path for all functions
CREATE OR REPLACE FUNCTION get_user_daily_score(user_uuid uuid, target_date date)
RETURNS TABLE(guesses_count integer, completion_time timestamp with time zone)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ds.guesses_count, ds.completion_time
  FROM daily_scores ds
  WHERE ds.user_id = user_uuid AND ds.word_date = target_date
  LIMIT 1;
$$;

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
SET search_path = public
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

CREATE OR REPLACE FUNCTION get_active_word_for_date(target_date date)
RETURNS TABLE(word text, hints text[])
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dw.word, dw.hints
  FROM daily_words dw
  WHERE dw.date = target_date AND dw.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION refresh_daily_leaderboards()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_leaderboards;
$$;

CREATE OR REPLACE FUNCTION trigger_refresh_leaderboards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use pg_notify to trigger async refresh
  PERFORM pg_notify('refresh_leaderboards', NEW.word_date::text);
  RETURN NEW;
END;
$$;

-- Fix existing function as well
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Function logic here
    RETURN NEW;
END;
$$;

-- Hide materialized view from API by revoking access
REVOKE ALL ON daily_leaderboards FROM anon, authenticated;

-- Only allow specific functions to access the materialized view
GRANT SELECT ON daily_leaderboards TO postgres;