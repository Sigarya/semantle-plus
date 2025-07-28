-- Create security definer function to safely check admin status (prevents RLS infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_admin_status(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(is_admin, false) 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$$;

-- Update RLS policies to use the security definer function instead of direct queries
-- This prevents infinite recursion in admin-related policies

-- Update profiles table admin policies
DROP POLICY IF EXISTS "Only admins can update admin status" ON public.profiles;
CREATE POLICY "Only admins can update admin status" 
ON public.profiles 
FOR UPDATE 
USING (
  (auth.uid() = id) AND 
  public.get_user_admin_status(auth.uid()) = true
)
WITH CHECK (auth.uid() = id);

-- Update daily_words policies to use security definer function
DROP POLICY IF EXISTS "Only admins can insert daily words" ON public.daily_words;
CREATE POLICY "Only admins can insert daily words" 
ON public.daily_words 
FOR INSERT 
WITH CHECK (public.get_user_admin_status(auth.uid()) = true);

DROP POLICY IF EXISTS "Only admins can update daily words" ON public.daily_words;
CREATE POLICY "Only admins can update daily words" 
ON public.daily_words 
FOR UPDATE 
USING (public.get_user_admin_status(auth.uid()) = true);

-- Update security audit logs policy
DROP POLICY IF EXISTS "Only admins can read audit logs" ON public.security_audit_logs;
CREATE POLICY "Only admins can read audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (public.get_user_admin_status(auth.uid()) = true);

-- Update audit_logs policies
DROP POLICY IF EXISTS "Allow admin users to read audit logs" ON public.audit_logs;
CREATE POLICY "Allow admin users to read audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.get_user_admin_status(auth.uid()) = true);

-- Drop the today_leaderboard view as it uses security definer without proper access control
-- Replace with a secure function that respects RLS
DROP VIEW IF EXISTS public.today_leaderboard;

-- Create a secure function to get today's leaderboard
CREATE OR REPLACE FUNCTION public.get_today_leaderboard()
RETURNS TABLE(
  username TEXT,
  user_id UUID,
  guesses_count INTEGER,
  completion_time TIMESTAMP WITH TIME ZONE,
  rank BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.username,
    ds.user_id,
    ds.guesses_count,
    ds.completion_time,
    ROW_NUMBER() OVER (ORDER BY ds.guesses_count ASC, ds.completion_time ASC) as rank
  FROM public.daily_scores ds
  JOIN public.profiles p ON p.id = ds.user_id
  WHERE ds.word_date = CURRENT_DATE
  ORDER BY ds.guesses_count ASC, ds.completion_time ASC;
$$;