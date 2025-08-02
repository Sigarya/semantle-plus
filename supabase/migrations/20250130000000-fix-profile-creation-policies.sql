-- Fix missing INSERT policy for profiles table
-- This allows authenticated users to create their own profiles during Google OAuth sign-in

-- Add INSERT policy for profiles table to allow users to create their own profiles
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Ensure the profiles table has RLS enabled (should already be enabled but ensure it)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add a SELECT policy if it doesn't exist to allow users to read profiles
-- (This might already exist but ensure users can read their own profiles)
CREATE POLICY IF NOT EXISTS "Users can read all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Note: Automatic profile creation is now handled by the client-side username selection flow
-- Users will be prompted to choose their username after Google sign-in
-- This ensures users get to pick their preferred username rather than auto-generated ones