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

  // Cross-room isolation + sync guards
  const activeRoomIdRef = useRef<string | null>(null);
  const playersFetchSeqRef = useRef<number>(0);
  const latestAppliedPlayersSeqRef = useRef<number>(0);

  useEffect(() => {
    activeRoomIdRef.current = gameState.room?.id ?? null;
  }, [gameState.room?.id]);

  // Minimal helper to refresh only players for the current room (guarded against staleness)
  const updatePlayersOnly = useCallback(async (roomId: string) => {
    if (!roomId) return;
    const seq = ++playersFetchSeqRef.current;
    try {
      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true);
      if (error || !data) return;
      if (activeRoomIdRef.current !== roomId) return; // cross-room isolation
      if (seq < latestAppliedPlayersSeqRef.current) return; // stale response guard
      latestAppliedPlayersSeqRef.current = seq;
      setGameState(prev => (prev.room && prev.room.id === roomId) ? { ...prev, players: data } : prev);
    } catch (_) {}
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
      if (timeoutTimers.warningTimer) {
        clearTimeout(timeoutTimers.warningTimer);
      }
      if (timeoutTimers.closingTimer) {
        clearTimeout(timeoutTimers.closingTimer);
      }
    };
  }, [realtimeChannel, syncInterval, timeoutTimers]);

  // ULTRA-SIMPLE SYNC SYSTEM: Just sync everything every 1 second
  const setupSimpleSync = useCallback((roomId: string) => {
    console.log("Setting up simple sync for room:", roomId);
    
    // Clear any existing sync
    if (syncInterval) {
      clearInterval(syncInterval);
    }

    // Simple sync every 1 second - no complex logic, just refresh everything
    const interval = setInterval(async () => {
      try {
        // Always refresh guesses
        const { data: refreshedGuesses, error: refreshError } = await supabase
          .from('room_guesses')
          .select(`
            *,
            room_players(nickname)
          `)
          .eq('room_id', roomId)
          .order('guess_order', { ascending: true });

        if (!refreshError && refreshedGuesses) {
          const guessesWithNicknames = refreshedGuesses.map(g => ({
            ...g,
            player_nickname: g.room_players?.nickname || 'Unknown'
          }));

          setGameState(prev => ({
            ...prev,
            guesses: guessesWithNicknames,
            isComplete: guessesWithNicknames.some(g => g.is_correct)
          }));
        }
        
        // Refresh players through guarded helper
        await updatePlayersOnly(roomId);
      } catch (error) {
        console.warn("Simple sync error:", error);
      }
    }, 1000);

    setSyncInterval(interval);
  }, [syncInterval]);

  // Function to manage room timeout
  const setupRoomTimeout = useCallback((roomId: string) => {
    // Clear any existing timers
    if (timeoutTimers.warningTimer) clearTimeout(timeoutTimers.warningTimer);
    if (timeoutTimers.closingTimer) clearTimeout(timeoutTimers.closingTimer);

    // Set warning timer (20 minutes)
    const warningTimer = setTimeout(() => {
      console.log("Room timeout warning triggered after 20 minutes of inactivity");
      setTimeoutState({
        isWarning: true,
        isClosing: false,
        warningTimeLeft: 300, // 5 minutes in seconds
        closingTimeLeft: 0
      });

      // Start countdown for warning period
      const warningCountdown = setInterval(() => {
        setTimeoutState(prev => {
          if (!prev) return prev;
          if (prev.warningTimeLeft <= 1) {
            clearInterval(warningCountdown);
            // Start closing countdown
            setTimeoutState({
              isWarning: false,
              isClosing: true,
              warningTimeLeft: 0,
              closingTimeLeft: 300 // 5 minutes in seconds
            });
            
            const closingCountdown = setInterval(() => {
              setTimeoutState(prev => {
                if (!prev) return prev;
                if (prev.closingTimeLeft <= 1) {
                  clearInterval(closingCountdown);
                  // Close the room
                  closeRoomDueToInactivity();
                  return null;
                }
                return {
                  ...prev,
                  closingTimeLeft: prev.closingTimeLeft - 1
                };
              });
            }, 1000);
            
            return prev;
          }
          return {
            ...prev,
            warningTimeLeft: prev.warningTimeLeft - 1
          };
        });
      }, 1000);

      setTimeoutTimers(prev => ({ ...prev, warningTimer: warningCountdown as any }));
    }, 20 * 60 * 1000); // 20 minutes

    setTimeoutTimers(prev => ({ ...prev, warningTimer: warningTimer as any }));
  }, [timeoutTimers]);

  // Function to reset timeout when activity occurs
  const resetRoomTimeout = useCallback((roomId: string) => {
    console.log("Resetting room timeout due to activity");
    setTimeoutState(null);
    setupRoomTimeout(roomId);
  }, [setupRoomTimeout]);

  // Function to close room due to inactivity
  const closeRoomDueToInactivity = useCallback(async () => {
    console.log("Closing room due to inactivity");
    
    // Update room status in database
    if (gameState.room) {
      try {
        await supabase
          .from('game_rooms')
          .update({ is_active: false })
          .eq('id', gameState.room.id);
      } catch (error) {
        console.error("Error updating room status:", error);
      }
    }
    
    // Reset state and show timeout message
    resetMultiplayerState();
    toast({
      title: "החדר נסגר",
      description: "החדר נסגר בגלל אי פעילות, אפשר לפתוח חדר ולהתחיל משחק חדש.",
      duration: 10000
    });
  }, [gameState.room, toast]);

  // Function to dismiss timeout warning
  const dismissTimeoutWarning = useCallback(() => {
    console.log("Timeout warning dismissed by user");
    setTimeoutState(null);
    if (gameState.room) {
      resetRoomTimeout(gameState.room.id);
    }
  }, [gameState.room, resetRoomTimeout]);

  // ULTRA-SIMPLE REALTIME: Just basic postgres changes, no complex broadcasting
  const setupSimpleRealtime = useCallback((roomId: string) => {
    console.log("Setting up simple realtime for room:", roomId);
    
    // Remove existing channel
    if (realtimeChannel) {
      console.log("Removing existing realtime channel");
      supabase.removeChannel(realtimeChannel);
    }

    // Create a simple channel with just postgres changes
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          if (activeRoomIdRef.current !== roomId) return;
          await updatePlayersOnly(roomId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          if (activeRoomIdRef.current !== roomId) return;
          const updated = payload.new as any;
          const oldRow = payload.old as any;
          if (!updated) return;
          if (updated.is_active === false) {
            setGameState(prev => prev.room && prev.room.id === roomId ? { ...prev, players: prev.players.filter(p => p.id !== updated.id) } : prev);
            if (oldRow && oldRow.guest_id !== currentGuestId && oldRow.nickname) {
              toast({ title: `${oldRow.nickname} עזב/ה את החדר` });
            }
          }
          await updatePlayersOnly(roomId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          if (activeRoomIdRef.current !== roomId) return;
          const oldRow = payload.old as any;
          if (oldRow?.id) {
            setGameState(prev => prev.room && prev.room.id === roomId ? { ...prev, players: prev.players.filter(p => p.id !== oldRow.id) } : prev);
            if (oldRow.guest_id !== currentGuestId && oldRow.nickname) {
              toast({ title: `${oldRow.nickname} עזב/ה את החדר` });
            }
          }
          await updatePlayersOnly(roomId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_guesses'
        },
        async (payload) => {
          console.log("New guess (realtime):", payload);
          // Let the sync system handle the update
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("Successfully subscribed to room:", roomId);
        }
      });

    setRealtimeChannel(channel);
    
    // Setup simple sync
    setupSimpleSync(roomId);
    
    // Setup room timeout
    setupRoomTimeout(roomId);
  }, [realtimeChannel, setupSimpleSync, setupRoomTimeout, updatePlayersOnly]);

  const createRoom = async (nickname: string, wordDate: string): Promise<string> => {
    setIsLoading(true);
    try {
      console.log("Creating room for date:", wordDate);
      
      // Generate room code using the database function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_room_code');
      
      if (codeError) {
        console.error("Detailed room code generation error:", codeError);
        throw new Error(`שגיאה ביצירת קוד חדר: ${codeError.message || codeError.details || 'Unknown database error'}`);
      }
      
      const roomCode = codeData;
      
      // Create the room as a guest with the specific word date
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          word_date: wordDate,
          guest_creator: currentGuestId
        })
        .select()
        .single();
      
      if (roomError) {
        console.error("Detailed room creation error:", roomError);
        throw new Error(`שגיאה ביצירת החדר: ${roomError.message || roomError.details || 'Unknown database error'}`);
      }
      
      // Join the room as the creator (conflict-safe insert/update)
      let playerData;
      {
        const { data: insRows, error: insErr } = await supabase
          .from('room_players')
          .insert({
            room_id: roomData.id,
            guest_id: currentGuestId,
            nickname: nickname,
            is_active: true
          })
          .select();
        if (!insErr && insRows && insRows.length > 0) {
          playerData = insRows[0];
        } else {
          const { data: updRows, error: updErr } = await supabase
            .from('room_players')
            .update({ nickname, is_active: true })
            .eq('room_id', roomData.id)
            .eq('guest_id', currentGuestId)
            .select();
          if (updErr || !updRows || updRows.length === 0) {
            throw new Error("שגיאה בהצטרפות לחדר");
          }
          playerData = updRows[0];
        }
      }
      
      // Get the current word for this specific date
      const { data: wordData } = await supabase
        .rpc('get_active_word_for_date', { target_date: wordDate });
      
      const currentWord = wordData && wordData.length > 0 ? wordData[0].word : null;
      
      console.log("Room created with word date:", wordDate, "and word:", currentWord);
      
      // Update state
      setGameState({
        room: roomData,
        players: [playerData],
        guesses: [],
        currentPlayer: playerData,
        isComplete: false,
        currentWord
      });
      
      // Setup simple realtime
      setupSimpleRealtime(roomData.id);
      
      return roomCode;
    } catch (error) {
      console.error("Detailed error creating room:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomCode: string, nickname: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Joining room with code:", roomCode);
      
      // Get room data with players
      const { data: roomData, error: roomError } = await supabase
        .rpc('get_room_with_players', { room_code_param: roomCode });
      
      if (roomError || !roomData || roomData.length === 0) {
        throw new Error("החדר לא נמצא או לא פעיל");
      }
      
      // Extract the room's word date - this is the source of truth
      const roomWordDate = roomData[0].word_date;
      console.log("Joining room with word date:", roomWordDate);
      
      const room = {
        id: roomData[0].room_id,
        room_code: roomData[0].room_code,
        word_date: roomWordDate,
        created_by: roomData[0].created_by,
        guest_creator: roomData[0].guest_creator,
        created_at: new Date().toISOString(),
        is_active: true,
        max_players: 10
      };
      
      // Purge any prior rows for this guest in this room (best-effort for legacy duplicates)
      const { error: cleanupError } = await supabase.rpc('cleanup_guest_player', {
        p_room_id: room.id,
        p_guest_id: currentGuestId,
      });

      if (cleanupError) {
        console.warn('Player cleanup failed, join might fail:', cleanupError);
      }

      // Insert-first, then update fallback on conflict/RLS
      let currentPlayer: RoomPlayer | null = null;
      {
        const { data: insRows, error: insErr } = await supabase
          .from('room_players')
          .insert({ room_id: room.id, guest_id: currentGuestId, nickname, is_active: true })
          .select();
        if (!insErr && insRows && insRows.length > 0) {
          currentPlayer = insRows[0] as any;
        } else {
          const { data: updRows, error: updErr } = await supabase
            .from('room_players')
            .update({ nickname, is_active: true })
            .eq('room_id', room.id)
            .eq('guest_id', currentGuestId)
            .select();
          if (updErr || !updRows || updRows.length === 0) {
            throw new Error("שגיאה בהצטרפות לחדר");
          }
          currentPlayer = updRows[0] as any;
        }
      }
      await updatePlayersOnly(room.id);
      
      // Fetch fresh players list from DB truth (avoid stale RPC aggregation)
      const { data: players, error: playersErr } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_active', true);
      if (playersErr) throw new Error("שגיאה בטעינת שחקנים");
      
      // Get existing guesses
      const { data: guessesData, error: guessesError } = await supabase
        .from('room_guesses')
        .select(`
          *,
          room_players(nickname)
        `)
        .eq('room_id', room.id)
        .order('guess_order', { ascending: true });
      
      if (guessesError) throw new Error("שגיאה בטעינת ניחושים");
      
      const guesses = (guessesData || []).map(g => ({
        ...g,
        player_nickname: g.room_players?.nickname || 'Unknown'
      }));
      
      // Get the current word for the room's specific date
      const { data: wordData } = await supabase
        .rpc('get_active_word_for_date', { target_date: roomWordDate });
      
      const currentWord = wordData && wordData.length > 0 ? wordData[0].word : null;
      
      console.log("Joined room with word date:", roomWordDate, "and word:", currentWord);
      
      // Check if game is complete
      const isComplete = guesses.some(g => g.is_correct);
      
      // Update state
      setGameState({
        room,
        players,
        guesses,
        currentPlayer,
        isComplete,
        currentWord
      });
      
      // Setup simple realtime
      setupSimpleRealtime(room.id);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בהצטרפות לחדר";
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const makeGuess = async (word: string): Promise<void> => {
    if (!gameState.room || !gameState.currentPlayer) {
      throw new Error("לא ניתן להכניס ניחוש");
    }
    
    if (gameState.isComplete) {
      throw new Error("המשחק הסתיים");
    }
    
    // SIMPLE DUPLICATE CHECK - Just check local state
    const localDuplicate = gameState.guesses.find(g => g.guess_word.toLowerCase() === word.toLowerCase());
    if (localDuplicate) {
      throw new Error(`המילה "${word}" כבר נוחשה על ידי ${localDuplicate.player_nickname}`);
    }
    
    try {
      console.log("Making guess:", { word, roomId: gameState.room.id, playerId: gameState.currentPlayer.id });
      
      // Calculate similarity using the existing edge function
      const { data: similarityData, error: similarityError } = await supabase.functions.invoke(
        "calculate-similarity", 
        { body: { guess: word, date: gameState.room.word_date } }
      );
      
      if (similarityError) {
        console.error("Similarity calculation error:", similarityError);
        throw new Error("שגיאה בחישוב הדמיון");
      }
      
      if (similarityData.error) {
        console.error("Similarity data error:", similarityData.error);
        throw new Error(similarityData.error);
      }
      
      const { similarity, rank } = similarityData;
      const isCorrect = similarity >= 0.99;
      
      console.log("Similarity calculated:", { similarity, rank, isCorrect });
      
      // Get next guess order
      const nextGuessOrder = gameState.guesses.length + 1;
      
      // Insert the guess
      const guessData = {
        room_id: gameState.room.id,
        player_id: gameState.currentPlayer.id,
        guess_word: word,
        similarity,
        rank: rank || null,
        is_correct: isCorrect,
        guess_order: nextGuessOrder
      };
      
      console.log("Inserting guess data:", guessData);
      
      const { data: insertedGuess, error: insertError } = await supabase
        .from('room_guesses')
        .insert(guessData)
        .select()
        .single();
      
      if (insertError) {
        console.error("Guess insertion error:", insertError);
        throw new Error(`שגיאה בשמירת הניחוש: ${insertError.message || insertError.details || 'Unknown database error'}`);
      }
      
      console.log("Guess inserted successfully:", insertedGuess);
      
      // Create a complete guess object with nickname
      const completeGuess = {
        ...insertedGuess,
        player_nickname: gameState.currentPlayer.nickname
      };
      
      // Update local state immediately for better UX
      setGameState(prev => ({
        ...prev,
        guesses: [...prev.guesses, completeGuess].sort((a, b) => a.guess_order - b.guess_order),
        isComplete: isCorrect || prev.isComplete
      }));
      
      // Reset room timeout due to activity
      resetRoomTimeout(gameState.room.id);
      
      console.log("Guess completed successfully - sync system will update other players within 1 second");
      
    } catch (error) {
      console.error("Error in makeGuess:", error);
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      throw new Error(errorMessage);
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!gameState.currentPlayer || !gameState.room) return;
    
    const playerToLeaveId = gameState.currentPlayer.id;
    const roomId = gameState.room.id;

    try {
      // Immediate local removal from roster for smooth UX
      setGameState(prev => {
        if (!prev.room || prev.room.id !== roomId) return prev;
        return { ...prev, players: prev.players.filter(p => p.id !== playerToLeaveId) };
      });
      
      // Call the secure RPC function to delete the player from the database
      const { error } = await supabase.rpc('leave_room', {
        player_id_to_delete: playerToLeaveId,
      });

      if (error) {
        // If the RPC fails, something is wrong. Log the error and alert the user.
        // We will still try to reset the state locally.
        console.error('Failed to leave room via RPC:', error);
        toast({
          title: "שגיאה בעזיבת החדר",
          description: "הייתה בעיה בעזיבת החדר. נסה לרענן את הדף.",
          variant: "destructive",
        });
      }
      
      // Nudge others via minimal refresh (optional, as realtime should handle it)
      await updatePlayersOnly(roomId);
      
      // Clear timeout state before resetting
      setTimeoutState(null);
      if (timeoutTimers.warningTimer) {
        clearTimeout(timeoutTimers.warningTimer);
      }
      if (timeoutTimers.closingTimer) {
        clearTimeout(timeoutTimers.closingTimer);
      }
      setTimeoutTimers({ warningTimer: null, closingTimer: null });
      
      resetMultiplayerState();
    } catch (error) {
      console.error("Error leaving room:", error);
      // Ensure local state is reset even if an unexpected error occurs
      resetMultiplayerState();
    }
  };

  const resetMultiplayerState = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }
    
    if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
    }
    
    // Clear timeout state and timers
    setTimeoutState(null);
    if (timeoutTimers.warningTimer) {
      clearTimeout(timeoutTimers.warningTimer);
    }
    if (timeoutTimers.closingTimer) {
      clearTimeout(timeoutTimers.closingTimer);
    }
    setTimeoutTimers({ warningTimer: null, closingTimer: null });
    
    setGameState({
      room: null,
      players: [],
      guesses: [],
      currentPlayer: null,
      isComplete: false,
      currentWord: null,
    });
  };

  const contextValue: MultiplayerContextType = {
    gameState,
    isLoading,
    createRoom,
    joinRoom,
    makeGuess,
    leaveRoom,
    resetMultiplayerState,
    timeoutState,
    dismissTimeoutWarning
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