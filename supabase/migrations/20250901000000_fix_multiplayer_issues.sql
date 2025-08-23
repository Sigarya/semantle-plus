-- This migration fixes several issues with the multiplayer functionality to create a more robust experience.

-- Set REPLICA IDENTITY to FULL for room_players table.
-- This ensures that when a player is deleted, Supabase's real-time service can access the
-- deleted row's data (like the nickname), which is essential for notifying other players
-- that someone has left the room.
ALTER TABLE public.room_players REPLICA IDENTITY FULL;

-- Add a unique constraint to prevent a guest from being in the same room more than once.
-- This is a safeguard against race conditions or client-side issues that could lead to
-- duplicate player entries. It only applies to guests (where guest_id is not null).
CREATE UNIQUE INDEX IF NOT EXISTS unique_guest_per_room ON public.room_players (room_id, guest_id) WHERE guest_id IS NOT NULL;

-- Create a secure function for players to leave a room.
-- Using a SECURITY DEFINER function is safer than a broad RLS policy for deletions.
-- The client provides the specific ID of the player to be removed, which is a non-guessable UUID.
CREATE OR REPLACE FUNCTION public.leave_room(player_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.room_players
  WHERE id = player_id_to_delete;
END;
$$;

-- Grant permission for all users (anonymous and authenticated) to use this function.
GRANT EXECUTE ON FUNCTION public.leave_room(uuid) TO anon, authenticated;

-- Create a secure function to clean up a guest's old entries in a room before they join/rejoin.
-- This function is called when a player joins a room to ensure they don't have any lingering
-- inactive records, which would cause errors.
CREATE OR REPLACE FUNCTION public.cleanup_guest_player(p_room_id uuid, p_guest_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.room_players
  WHERE room_id = p_room_id AND guest_id = p_guest_id;
END;
$$;

-- Grant permission for all users to use this cleanup function.
GRANT EXECUTE ON FUNCTION public.cleanup_guest_player(uuid, text) TO anon, authenticated;
