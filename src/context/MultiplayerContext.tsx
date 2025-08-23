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
  timeoutState: {
    isWarning: boolean;
    isClosing: boolean;
    warningTimeLeft: number;
    closingTimeLeft: number;
  } | null;
  dismissTimeoutWarning: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

// Generate unique guest ID
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
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeoutState, setTimeoutState] = useState<{
    isWarning: boolean;
    isClosing: boolean;
    warningTimeLeft: number;
    closingTimeLeft: number;
  } | null>(null);
  const [timeoutTimers, setTimeoutTimers] = useState<{
    warningTimer: NodeJS.Timeout | null;
    closingTimer: NodeJS.Timeout | null;
  }>({ warningTimer: null, closingTimer: null });

  // This ref helps us make sure we don't accidentally update a room we've already left.
  const activeRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeRoomIdRef.current = gameState.room?.id ?? null;
  }, [gameState.room?.id]);

  // ✨ NEW: Our single, reliable function to sync all game data. ✨
  const syncGameState = useCallback(async (roomId: string) => {
    // Guard: If we're not in a room or in a different room, do nothing.
    if (activeRoomIdRef.current !== roomId) {
      console.log("Sync skipped: Not in the active room.", { active: activeRoomIdRef.current, target: roomId });
      return;
    }

    try {
      console.log(`Syncing all game state for room: ${roomId}`);
      
      // Fetch players and guesses in parallel to be faster
      const [playersResponse, guessesResponse] = await Promise.all([
        supabase.from('room_players').select('*').eq('room_id', roomId).eq('is_active', true),
        supabase.from('room_guesses').select('*, room_players!inner(nickname)').eq('room_id', roomId).order('guess_order', { ascending: true })
      ]);

      const { data: players, error: playersError } = playersResponse;
      const { data: guesses, error: guessesError } = guessesResponse;

      if (playersError || guessesError) {
        console.error("Error during sync:", { playersError, guessesError });
        return;
      }

      const guessesWithNicknames = guesses.map(g => ({
        ...g,
        player_nickname: (g.room_players as any)?.nickname || 'Unknown'
      }));

      const isComplete = guessesWithNicknames.some(g => g.is_correct);

      // This is the magic: we update the entire game state at once from the database.
      // The database is our "single source of truth".
      setGameState(prev => {
        // Only update if we are still in the same room
        if (prev.room?.id === roomId) {
          return {
            ...prev,
            players: players || prev.players,
            guesses: guessesWithNicknames,
            isComplete: isComplete,
          };
        }
        return prev;
      });

    } catch (error) {
      console.error("A critical error occurred during syncGameState:", error);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      if (timeoutTimers.warningTimer) clearTimeout(timeoutTimers.warningTimer);
      if (timeoutTimers.closingTimer) clearTimeout(timeoutTimers.closingTimer);
    };
  }, [realtimeChannel, syncInterval, timeoutTimers]);

  // This function just sets up a backup timer that syncs the game every 5 seconds.
  const setupBackupSync = useCallback((roomId: string) => {
    console.log("Setting up backup sync for room:", roomId);
    if (syncInterval) clearInterval(syncInterval);

    const interval = setInterval(() => {
      console.log("Running backup sync...");
      syncGameState(roomId);
    }, 5000); // 5 seconds is plenty for a backup.

    setSyncInterval(interval);
  }, [syncInterval, syncGameState]);

  // Function to manage room timeout
  const setupRoomTimeout = useCallback((roomId: string) => {
    if (timeoutTimers.warningTimer) clearTimeout(timeoutTimers.warningTimer);
    if (timeoutTimers.closingTimer) clearTimeout(timeoutTimers.closingTimer);

    const warningTimer = setTimeout(() => {
      console.log("Room timeout warning triggered after 20 minutes of inactivity");
      setTimeoutState({
        isWarning: true,
        isClosing: false,
        warningTimeLeft: 300, 
        closingTimeLeft: 0
      });

      const warningCountdown = setInterval(() => {
        setTimeoutState(prev => {
          if (!prev || prev.warningTimeLeft <= 1) {
            clearInterval(warningCountdown);
            setTimeoutState({ isWarning: false, isClosing: true, warningTimeLeft: 0, closingTimeLeft: 300 });
            const closingCountdown = setInterval(() => {
              setTimeoutState(prevClosing => {
                if (!prevClosing || prevClosing.closingTimeLeft <= 1) {
                  clearInterval(closingCountdown);
                  closeRoomDueToInactivity();
                  return null;
                }
                return { ...prevClosing, closingTimeLeft: prevClosing.closingTimeLeft - 1 };
              });
            }, 1000);
            setTimeoutTimers(prevT => ({...prevT, closingTimer: closingCountdown as any}));
            return prev;
          }
          return { ...prev, warningTimeLeft: prev.warningTimeLeft - 1 };
        });
      }, 1000);
      setTimeoutTimers(prev => ({...prev, warningTimer: warningCountdown as any}));
    }, 20 * 60 * 1000);
    setTimeoutTimers(prev => ({ ...prev, warningTimer: warningTimer as any }));
  }, [timeoutTimers]);

  const resetRoomTimeout = useCallback((roomId: string) => {
    console.log("Resetting room timeout due to activity");
    setTimeoutState(null);
    if (timeoutTimers.warningTimer) clearTimeout(timeoutTimers.warningTimer);
    if (timeoutTimers.closingTimer) clearTimeout(timeoutTimers.closingTimer);
    setupRoomTimeout(roomId);
  }, [setupRoomTimeout, timeoutTimers]);

  const closeRoomDueToInactivity = useCallback(async () => {
    console.log("Closing room due to inactivity");
    if (gameState.room) {
      await supabase.from('game_rooms').update({ is_active: false }).eq('id', gameState.room.id);
    }
    cleanupMultiplayer();
    toast({
      title: "החדר נסגר",
      description: "החדר נסגר בגלל אי פעילות, אפשר לפתוח חדר ולהתחיל משחק חדש.",
      duration: 10000
    });
  }, [gameState.room, toast]);

  const dismissTimeoutWarning = useCallback(() => {
    console.log("Timeout warning dismissed by user");
    if (gameState.room) {
      resetRoomTimeout(gameState.room.id);
    }
  }, [gameState.room, resetRoomTimeout]);

  // ✨ UPDATED: Real-time now triggers our new sync function! ✨
  const setupRealtimeAndSync = useCallback((roomId: string) => {
    console.log("Setting up REALTIME and SYNC for room:", roomId);
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log("Realtime: Player change detected!", payload.eventType);
          // When any player joins or leaves, sync the whole game state.
          syncGameState(roomId); 
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_guesses', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log("Realtime: New guess detected!");
          // This is the key fix! When a new guess is inserted, sync immediately.
          syncGameState(roomId);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("Successfully subscribed to room:", roomId);
          // Do an initial sync right after connecting successfully.
          syncGameState(roomId);
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          console.error("Realtime subscription failed:", status);
          setTimeout(() => {
            if (activeRoomIdRef.current === roomId) {
              console.log("Attempting to reconnect realtime...");
              setupRealtimeAndSync(roomId);
            }
          }, 2000);
        }
      });

    setRealtimeChannel(channel);
    setupBackupSync(roomId); // The backup timer
    setupRoomTimeout(roomId); // The inactivity timer
  }, [realtimeChannel, syncGameState, setupBackupSync, setupRoomTimeout]);

  const createRoom = async (nickname: string, wordDate: string): Promise<string> => {
    setIsLoading(true);
    try {
      const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw new Error(`שגיאה ביצירת קוד חדר: ${codeError.message}`);
      const roomCode = codeData;

      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms').insert({ room_code: roomCode, word_date: wordDate, guest_creator: currentGuestId })
        .select().single();
      if (roomError) throw new Error(`שגיאה ביצירת החדר: ${roomError.message}`);
      
      const { data: playerData, error: playerError } = await supabase
        .from('room_players').insert({ room_id: roomData.id, guest_id: currentGuestId, nickname: nickname, is_active: true })
        .select().single();
      if (playerError) throw new Error("שגיאה בהצטרפות לחדר");

      const { data: wordData } = await supabase.rpc('get_active_word_for_date', { target_date: wordDate });
      const currentWord = wordData?.[0]?.word || null;
      
      setGameState({
        room: roomData, players: [playerData], guesses: [],
        currentPlayer: playerData, isComplete: false, currentWord
      });
      
      setupRealtimeAndSync(roomData.id);
      return roomCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "שגיאה", description: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomCode: string, nickname: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data: roomRpcData, error: roomError } = await supabase.rpc('get_room_with_players', { room_code_param: roomCode });
      if (roomError || !roomRpcData?.[0]) throw new Error("החדר לא נמצא או לא פעיל");

      const room: GameRoom = {
        id: roomRpcData[0].room_id, room_code: roomRpcData[0].room_code, word_date: roomRpcData[0].word_date,
        created_by: roomRpcData[0].created_by, guest_creator: roomRpcData[0].guest_creator, created_at: new Date().toISOString(),
        is_active: true, max_players: 10
      };
      
      // Upsert logic for joining: update if exists, insert if not. More robust.
      const { data: currentPlayer, error: joinError } = await supabase
        .from('room_players')
        .upsert({ room_id: room.id, guest_id: currentGuestId, nickname, is_active: true }, { onConflict: 'room_id, guest_id' })
        .select()
        .single();
      if (joinError || !currentPlayer) throw new Error("שגיאה בהצטרפות לחדר");

      const { data: wordData } = await supabase.rpc('get_active_word_for_date', { target_date: room.word_date });
      const currentWord = wordData?.[0]?.word || null;

      // Set initial state. The sync will fetch players and guesses right after.
      setGameState({ room, players: [], guesses: [], currentPlayer, isComplete: false, currentWord });
      
      setupRealtimeAndSync(room.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בהצטרפות לחדר";
      toast({ title: "שגיאה", description: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ SIMPLIFIED: `makeGuess` now focuses only on sending the guess. ✨
  const makeGuess = async (word: string): Promise<void> => {
    if (!gameState.room || !gameState.currentPlayer || gameState.isComplete) {
      throw new Error("לא ניתן להכניס ניחוש כרגע");
    }
    
    if (gameState.guesses.some(g => g.guess_word.toLowerCase() === word.toLowerCase())) {
      throw new Error(`המילה "${word}" כבר נוחשה`);
    }
    
    try {
      const { data: similarityData, error: similarityError } = await supabase.functions.invoke(
        "calculate-similarity", { body: { guess: word, date: gameState.room.word_date } }
      );
      if (similarityError) throw new Error("שגיאה בחישוב הדמיון");
      if (similarityData.error) throw new Error(similarityData.error);
      
      const { similarity, rank } = similarityData;
      
      // Insert the guess into the database
      const { error: insertError } = await supabase.from('room_guesses').insert({
        room_id: gameState.room.id,
        player_id: gameState.currentPlayer.id,
        guess_word: word,
        similarity,
        rank: rank || null,
        is_correct: similarity >= 0.99,
        guess_order: gameState.guesses.length + 1
      });
      
      if (insertError) {
        throw new Error(`שגיאה בשמירת הניחוש: ${insertError.message}`);
      }
      
      // The real-time listener will now see this new guess and trigger syncGameState for everyone.
      // We don't need to update the local state here anymore!
      
      resetRoomTimeout(gameState.room.id);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      throw new Error(errorMessage);
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!gameState.currentPlayer || !gameState.room) return;
    
    const playerToLeaveId = gameState.currentPlayer.id;

    try {
      // Deleting the player will trigger a real-time event for everyone else.
      await supabase.from('room_players').delete().eq('id', playerToLeaveId);
    } catch (error) {
      console.error('Failed to leave room:', error);
      toast({ title: "שגיאה בעזיבת החדר", variant: "destructive" });
    } finally {
      // Clean up our own state locally.
      cleanupMultiplayer();
    }
  };

  const cleanupMultiplayer = useCallback(() => {
    console.log("Cleaning up multiplayer state completely");
    activeRoomIdRef.current = null;
    if (syncInterval) clearInterval(syncInterval);
    setSyncInterval(null);
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    setRealtimeChannel(null);
    if (timeoutTimers.warningTimer) clearTimeout(timeoutTimers.warningTimer);
    if (timeoutTimers.closingTimer) clearTimeout(timeoutTimers.closingTimer);
    setTimeoutTimers({ warningTimer: null, closingTimer: null });
    setTimeoutState(null);
    setGameState({
      room: null, players: [], guesses: [],
      currentPlayer: null, isComplete: false, currentWord: null
    });
  }, [realtimeChannel, syncInterval, timeoutTimers]);

  const contextValue: MultiplayerContextType = {
    gameState, isLoading, createRoom, joinRoom, makeGuess, leaveRoom,
    resetMultiplayerState: cleanupMultiplayer,
    timeoutState, dismissTimeoutWarning
  };

  return (
    <MultiplayerContext.Provider value={contextValue}>
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