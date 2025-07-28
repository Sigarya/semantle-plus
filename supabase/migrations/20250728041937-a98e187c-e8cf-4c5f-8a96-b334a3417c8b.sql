-- Fix security definer functions by setting proper search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _action_type TEXT,
  _max_requests INTEGER DEFAULT 10,
  _window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id UUID,
  _action TEXT,
  _resource_type TEXT,
  _resource_id TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action, resource_type, resource_id, metadata
  ) VALUES (
    _user_id, _action, _resource_type, _resource_id, _metadata
  );
END;
$$;

-- Fix log_admin_changes function
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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