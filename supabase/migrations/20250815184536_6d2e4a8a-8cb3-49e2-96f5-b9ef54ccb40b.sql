-- Remove the overly permissive public read policy for profiles
DROP POLICY IF EXISTS "Anyone can read public profiles" ON public.profiles;

-- Ensure users can still read their own profiles (keep existing user-specific policies)
-- The existing policies "Users can read their own profile" and "Users can view their own profile" 
-- already handle this securely by checking auth.uid() = id

-- For leaderboards and other public features that need usernames,
-- those should use SECURITY DEFINER functions (which already exist and can bypass RLS)
-- This maintains functionality while securing the data