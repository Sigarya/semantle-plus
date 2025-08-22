-- Fix search path security warnings by updating functions
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 6-character code with uppercase letters and numbers
    code := upper(substring(md5(random()::text), 1, 6));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.game_rooms 
    WHERE room_code = code AND is_active = true;
    
    -- Exit loop if unique code found
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Fix search path for get_room_with_players function
CREATE OR REPLACE FUNCTION public.get_room_with_players(room_code_param TEXT)
RETURNS TABLE(
  room_id UUID,
  room_code TEXT,
  word_date DATE,
  created_by UUID,
  player_id UUID,
  user_id UUID,
  nickname TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gr.id as room_id,
    gr.room_code,
    gr.word_date,
    gr.created_by,
    rp.id as player_id,
    rp.user_id,
    rp.nickname,
    rp.joined_at
  FROM public.game_rooms gr
  LEFT JOIN public.room_players rp ON gr.id = rp.room_id AND rp.is_active = true
  WHERE gr.room_code = room_code_param AND gr.is_active = true
  ORDER BY rp.joined_at ASC;
END;
$$;