-- Add guest support for multiplayer rooms
-- This migration allows users to play multiplayer games without authentication

-- Add guest_creator field to game_rooms table
ALTER TABLE public.game_rooms 
ADD COLUMN IF NOT EXISTS guest_creator TEXT;

-- Add guest_id field to room_players table
ALTER TABLE public.room_players 
ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- Create index for guest_id lookups
CREATE INDEX IF NOT EXISTS idx_room_players_guest_id ON public.room_players(guest_id);

-- Update RLS policies to allow guest access

-- Allow guests to create rooms
CREATE POLICY "Guests can create rooms" ON public.game_rooms 
FOR INSERT WITH CHECK (guest_creator IS NOT NULL OR created_by IS NOT NULL);

-- Allow guests to view rooms
CREATE POLICY "Guests can view rooms" ON public.game_rooms 
FOR SELECT USING (is_active = true);

-- Allow guests to join rooms
CREATE POLICY "Guests can join rooms" ON public.room_players 
FOR INSERT WITH CHECK (
  guest_id IS NOT NULL OR 
  (user_id IS NOT NULL AND auth.uid() = user_id)
);

-- Allow guests to view players in rooms
CREATE POLICY "Guests can view players in rooms" ON public.room_players 
FOR SELECT USING (
  is_active = true AND (
    guest_id IS NOT NULL OR 
    EXISTS (
      SELECT 1 FROM public.room_players rp2 
      WHERE rp2.room_id = room_id AND rp2.is_active = true
    )
  )
);

-- Allow guests to update their own room data
CREATE POLICY "Guests can update their own room data" ON public.room_players 
FOR UPDATE USING (
  guest_id IS NOT NULL OR 
  (user_id IS NOT NULL AND auth.uid() = user_id)
);

-- Allow guests to create guesses
CREATE POLICY "Guests can create guesses" ON public.room_guesses 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_players rp 
    WHERE rp.id = player_id AND rp.is_active = true AND
    (rp.guest_id IS NOT NULL OR rp.user_id = auth.uid())
  )
);

-- Allow guests to view guesses in rooms
CREATE POLICY "Guests can view guesses in rooms" ON public.room_guesses 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_players rp 
    WHERE rp.room_id = room_id AND rp.is_active = true AND
    (rp.guest_id IS NOT NULL OR rp.user_id = auth.uid())
  )
);

-- Update the get_room_with_players function to include guest information
CREATE OR REPLACE FUNCTION public.get_room_with_players(room_code_param TEXT)
RETURNS TABLE(
  room_id UUID,
  room_code TEXT,
  word_date DATE,
  created_by UUID,
  guest_creator TEXT,
  player_id UUID,
  user_id UUID,
  guest_id TEXT,
  nickname TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gr.id as room_id,
    gr.room_code,
    gr.word_date,
    gr.created_by,
    gr.guest_creator,
    rp.id as player_id,
    rp.user_id,
    rp.guest_id,
    rp.nickname,
    rp.joined_at
  FROM public.game_rooms gr
  LEFT JOIN public.room_players rp ON gr.id = rp.room_id AND rp.is_active = true
  WHERE gr.room_code = room_code_param AND gr.is_active = true
  ORDER BY rp.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the generate_room_code function to work without authentication
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
