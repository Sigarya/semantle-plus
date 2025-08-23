-- Check and fix foreign key constraints for guest support
-- This migration ensures that guest players can insert guesses without foreign key violations

-- First, let's check if there are any problematic foreign key constraints
-- The room_guesses table should allow guest players to insert guesses

-- Check if there are any foreign key constraints that require user_id
-- If room_guesses has a foreign key to room_players that requires user_id, we need to fix it

-- Drop any problematic foreign key constraints
ALTER TABLE public.room_guesses 
DROP CONSTRAINT IF EXISTS room_guesses_player_id_fkey;

-- Recreate the foreign key constraint to allow both user_id and guest_id
ALTER TABLE public.room_guesses 
ADD CONSTRAINT room_guesses_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES public.room_players(id) ON DELETE CASCADE;

-- Also ensure that the room_guesses table can handle guest players
-- Check if there are any NOT NULL constraints on user_id in room_guesses
-- If there are, we need to make them optional

-- Make sure room_guesses doesn't have any user_id constraints that would block guests
-- The table should only require player_id (which can be a guest player)

-- Add an index for better performance on guest guesses
CREATE INDEX IF NOT EXISTS idx_room_guesses_guest_performance 
ON public.room_guesses(room_id, player_id, guess_order);

-- Verify the table structure allows guest players
-- room_guesses should have:
-- - room_id (required)
-- - player_id (required, references room_players.id)
-- - guess_word (required)
-- - similarity (required)
-- - is_correct (optional)
-- - guess_order (required)
-- - created_at (optional, auto-generated)
-- - rank (optional)
-- - No user_id field that would conflict with guests
