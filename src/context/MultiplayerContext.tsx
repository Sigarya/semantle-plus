import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { MultiplayerGameState, GameRoom, RoomPlayer, RoomGuess } from "@/types/multiplayer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

interface MultiplayerContextType {
  gameState: MultiplayerGameState;
  isLoading: boolean;
  createRoom: (nickname: string, wordDate: string) => Promise<string>;
  joinRoom: (roomCode: string, nickname: string) => Promise<void>;
  makeGuess: (word: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  resetMultiplayerState: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

const generateGuestId = (): string => {
  return 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

export const MultiplayerProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<MultiplayerGameState>({
    room: null,
    players: [],
    guesses: [],
    currentPlayer: null,
    isComplete: false,
    currentWord: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [currentGuestId, setCurrentGuestId] = useState<string>(() => generateGuestId());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeRoomIdRef.current = gameState.room?.id ?? null;
  }, [gameState.room?.id]);

  // ✨ THE PERFECT CLEANUP FUNCTION ✨
  // This is our new, ruthless reset button.
  const cleanupMultiplayer = useCallback(() => {
    console.log("Running FULL multiplayer cleanup...");
    
    // 1. Immediately kill the inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // 2. Unsubscribe and completely remove the channel to prevent dangling connections
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }
    
    // 3. Reset every single piece of the game state to its original, empty state
    setGameState({
      room: null,
      players: [],
      guesses: [],
      currentPlayer: null,
      isComplete: false,
      currentWord: null
    });

    // 4. Reset the loading status
    setIsLoading(false);

    console.log("Cleanup complete. Ready for a new game.");
  }, [realtimeChannel]);

  // This function now only syncs guesses, as Presence handles the player list
  const syncGuesses = useCallback(async (roomId: string) => {
    if (activeRoomIdRef.current !== roomId) return;
    try {
      const { data, error } = await supabase.from('room_guesses').select('*, room_players!inner(nickname)').eq('room_id', roomId).order('guess_order', { ascending: true });
      if (error) return;
      const guessesWithNicknames = data.map(g => ({ ...g, player_nickname: (g.room_players as any)?.nickname || 'Unknown' }));
      setGameState(prev => (prev.room?.id === roomId ? { ...prev, guesses: guessesWithNicknames, isComplete: guessesWithNicknames.some(g => g.is_correct) } : prev));
    } catch { /* ignore */ }
  }, []);
  
  // This function archives the room after 25 minutes of inactivity
  const archiveRoomDueToInactivity = useCallback(async (roomId: string) => {
    console.log(`Archiving room ${roomId} due to 25 minutes of inactivity.`);
    await supabase.from('game_rooms').update({ is_active: false }).eq('id', roomId);
    if (activeRoomIdRef.current === roomId) {
        cleanupMultiplayer();
        toast({
            title: "החדר נסגר",
            description: "החדר נסגר עקב חוסר פעילות.",
            duration: 10000
        });
    }
  }, [cleanupMultiplayer, toast]);

  // Resets the 25-minute "death timer" for the room
  const resetInactivityTimer = useCallback((roomId: string) => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      archiveRoomDueToInactivity(roomId);
    }, 25 * 60 * 1000); // 25 minutes
  }, [archiveRoomDueToInactivity]);

  const setupRealtimeAndPresence = useCallback((roomId: string, player: RoomPlayer) => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase.channel(`room_${roomId}`, { config: { presence: { key: player.guest_id } } });

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const activePlayers = Object.values(presenceState).map(p => (p[0] as any));
      setGameState(prev => ({ ...prev, players: activePlayers as RoomPlayer[] }));
    });

    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_guesses', filter: `room_id=eq.${roomId}` }, () => {
      syncGuesses(roomId);
      resetInactivityTimer(roomId); // Any guess resets the timer!
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ id: player.id, nickname: player.nickname, guest_id: player.guest_id });
        await syncGuesses(roomId);
        resetInactivityTimer(roomId); // Starting the session resets the timer
      }
    });

    setRealtimeChannel(channel);
  }, [realtimeChannel, syncGuesses, resetInactivityTimer]);

  const createRoom = async (nickname: string, wordDate: string): Promise<string> => {
    setIsLoading(true);
    cleanupMultiplayer(); // Start with a clean slate
    try {
      const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw new Error(`שגיאה ביצירת קוד חדר`);
      const roomCode = codeData;

      const { data: roomData, error: roomError } = await supabase.from('game_rooms').insert({ room_code: roomCode, word_date: wordDate, guest_creator: currentGuestId }).select().single();
      if (roomError) throw new Error(`שגיאה ביצירת החדר`);
      
      const { data: playerData, error: playerError } = await supabase.from('room_players').insert({ room_id: roomData.id, guest_id: currentGuestId, nickname, is_active: true }).select().single();
      if (playerError) throw new Error("שגיאה בהצטרפות לחדר");

      const { data: wordData } = await supabase.rpc('get_active_word_for_date', { target_date: wordDate });
      const currentWord = wordData?.[0]?.word || null;
      
      setGameState({ room: roomData, players: [playerData], guesses: [], currentPlayer: playerData, isComplete: false, currentWord });
      
      setupRealtimeAndPresence(roomData.id, playerData);
      return roomCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "שגיאה", description: errorMessage, variant: "destructive" });
      cleanupMultiplayer();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const joinRoom = async (roomCode: string, nickname: string): Promise<void> => {
    setIsLoading(true);
    cleanupMultiplayer(); // Start with a clean slate
    try {
      const { data: roomRpcData, error: roomError } = await supabase.rpc('get_room_with_players', { room_code_param: roomCode });
      if (roomError || !roomRpcData?.[0]) throw new Error("החדר לא נמצא או לא פעיל");

      const room: GameRoom = { id: roomRpcData[0].room_id, room_code: roomRpcData[0].room_code, word_date: roomRpcData[0].word_date, created_by: roomRpcData[0].created_by, guest_creator: roomRpcData[0].guest_creator, created_at: new Date().toISOString(), is_active: true, max_players: 10 };
      
      const { data: currentPlayer, error: joinError } = await supabase.from('room_players').upsert({ room_id: room.id, guest_id: currentGuestId, nickname, is_active: true }, { onConflict: 'room_id, guest_id' }).select().single();
      if (joinError || !currentPlayer) throw new Error("שגיאה בהצטרפות לחדר");

      const { data: wordData } = await supabase.rpc('get_active_word_for_date', { target_date: room.word_date });
      const currentWord = wordData?.[0]?.word || null;

      // Set minimal state; Presence and sync will fill in the rest
      setGameState({ room, players: [], guesses: [], currentPlayer, isComplete: false, currentWord });
      
      setupRealtimeAndPresence(room.id, currentPlayer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בהצטרפות לחדר";
      toast({ title: "שגיאה", description: errorMessage, variant: "destructive" });
      cleanupMultiplayer();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const makeGuess = async (word: string): Promise<void> => {
    // ... (This function remains the same as the previous step, it's already perfect)
    if (!gameState.room || !gameState.currentPlayer || gameState.isComplete) throw new Error("Cannot make guess");
    if (gameState.guesses.some(g => g.guess_word.toLowerCase() === word.toLowerCase())) throw new Error(`המילה "${word}" כבר נוחשה`);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-similarity", { body: { guess: word, date: gameState.room.word_date } });
      if (error || data.error) throw new Error(data.error || "שגיאה בחישוב הדמיון");
      const { similarity, rank } = data;
      await supabase.from('room_guesses').insert({ room_id: gameState.room.id, player_id: gameState.currentPlayer.id, guess_word: word, similarity, rank: rank || null, is_correct: similarity >= 0.99, guess_order: gameState.guesses.length + 1 });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "שגיאה בניחוש המילה");
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!gameState.currentPlayer || !realtimeChannel) return;
    
    // Gracefully untrack from Presence and mark as inactive
    await realtimeChannel.untrack();
    await supabase.from('room_players').update({ is_active: false }).eq('id', gameState.currentPlayer.id);
    
    // Run the perfect cleanup
    cleanupMultiplayer();
  };

  return (
    <MultiplayerContext.Provider value={{ gameState, isLoading, createRoom, joinRoom, makeGuess, leaveRoom, resetMultiplayerState: cleanupMultiplayer }}>
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider");
  }
  return context;
};