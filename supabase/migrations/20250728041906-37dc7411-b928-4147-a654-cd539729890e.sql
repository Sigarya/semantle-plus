-- Security Fix 1: Prevent admin privilege escalation
-- Drop the existing update policy that allows users to modify is_admin
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a new update policy that excludes is_admin field
CREATE POLICY "Users can update their own profile (non-admin fields)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Create a separate policy for admin field updates (only existing admins can modify)
CREATE POLICY "Only admins can update admin status" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (auth.uid() = id);

-- Security Fix 2: Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Security Fix 3: Add rate limiting table for guess submissions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, action_type, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users can see their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (auth.uid() = user_id);

-- System can manage rate limits
CREATE POLICY "System can insert rate limits" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update rate limits" 
ON public.rate_limits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Security Fix 4: Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _action_type TEXT,
  _max_requests INTEGER DEFAULT 10,
  _window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _window_start TIMESTAMP WITH TIME ZONE;
  _current_count INTEGER;
BEGIN
  -- Calculate window start time
  _window_start := date_trunc('minute', now()) - INTERVAL '1 minute' * (_window_minutes - 1);
  
  -- Get current count for this window
  SELECT COALESCE(SUM(count), 0) INTO _current_count
  FROM public.rate_limits
  WHERE user_id = _user_id 
    AND action_type = _action_type 
    AND window_start >= _window_start;
  
  -- Return false if rate limit exceeded
  IF _current_count >= _max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update rate limit record
  INSERT INTO public.rate_limits (user_id, action_type, window_start, count)
  VALUES (_user_id, _action_type, date_trunc('minute', now()), 1)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET count = rate_limits.count + 1;
  
  RETURN TRUE;
END;
$$;

-- Security Fix 5: Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id UUID,
  _action TEXT,
  _resource_type TEXT,
  _resource_id TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action, resource_type, resource_id, metadata
  ) VALUES (
    _user_id, _action, _resource_type, _resource_id, _metadata
  );
END;
$$;

-- Security Fix 6: Add constraints to prevent data manipulation
ALTER TABLE public.profiles 
ADD CONSTRAINT check_username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 50);

ALTER TABLE public.profiles 
ADD CONSTRAINT check_username_format CHECK (username ~ '^[א-תa-zA-Z0-9_\-\.]+$');

-- Security Fix 7: Add trigger to log admin status changes
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log when admin status changes
  IF OLD.is_admin != NEW.is_admin THEN
    PERFORM public.log_security_event(
      NEW.id,
      CASE WHEN NEW.is_admin THEN 'admin_granted' ELSE 'admin_revoked' END,
      'profile',
      NEW.id::TEXT,
      jsonb_build_object(
        'old_is_admin', OLD.is_admin,
        'new_is_admin', NEW.is_admin,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for admin changes
DROP TRIGGER IF EXISTS log_admin_changes_trigger ON public.profiles;
CREATE TRIGGER log_admin_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_changes();