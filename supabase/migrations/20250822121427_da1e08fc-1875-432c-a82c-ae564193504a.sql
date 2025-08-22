-- Create game_rooms table for multiplayer rooms
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  word_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_players INTEGER NOT NULL DEFAULT 10
);

-- Create room_players table to track players in rooms
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Create room_guesses table to store guesses made in multiplayer rooms
CREATE TABLE public.room_guesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.room_players(id) ON DELETE CASCADE,
  guess_word TEXT NOT NULL,
  similarity NUMERIC NOT NULL,
  rank INTEGER,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  guess_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_guesses ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_rooms
CREATE POLICY "Users can create rooms" ON public.game_rooms 
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view active rooms they're part of" ON public.game_rooms 
FOR SELECT USING (
  is_active = true AND (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.room_players rp 
      WHERE rp.room_id = id AND rp.user_id = auth.uid() AND rp.is_active = true
    )
  )
);

CREATE POLICY "Room creators can update their rooms" ON public.game_rooms 
FOR UPDATE USING (created_by = auth.uid());

-- RLS policies for room_players
CREATE POLICY "Users can join rooms" ON public.room_players 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can view other players in their rooms" ON public.room_players 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_players rp2 
    WHERE rp2.room_id = room_id AND rp2.user_id = auth.uid() AND rp2.is_active = true
  )
);

CREATE POLICY "Players can update their own room data" ON public.room_players 
FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for room_guesses  
CREATE POLICY "Players can create guesses in their rooms" ON public.room_guesses 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_players rp 
    WHERE rp.id = player_id AND rp.user_id = auth.uid() AND rp.is_active = true
  )
);

CREATE POLICY "Players can view guesses in their rooms" ON public.room_guesses 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_players rp 
    WHERE rp.room_id = room_id AND rp.user_id = auth.uid() AND rp.is_active = true
  )
);

-- Create indexes for performance
CREATE INDEX idx_game_rooms_room_code ON public.game_rooms(room_code);
CREATE INDEX idx_game_rooms_word_date ON public.game_rooms(word_date);
CREATE INDEX idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX idx_room_players_user_id ON public.room_players(user_id);
CREATE INDEX idx_room_guesses_room_id ON public.room_guesses(room_id);
CREATE INDEX idx_room_guesses_player_id ON public.room_guesses(player_id);

-- Function to generate unique room codes
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

-- Function to get room with players
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;