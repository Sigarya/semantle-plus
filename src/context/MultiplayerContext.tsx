import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { MultiplayerGameState, GameRoom, RoomPlayer, RoomGuess } from "@/types/multiplayer";
import { useAuth } from "./AuthContext";
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

export const MultiplayerProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
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

  // Cleanup realtime channel on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  const setupRealtimeSubscription = useCallback((roomId: string) => {
    // Remove existing channel
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_players'
        },
        async (payload) => {
          const newPlayer = payload.new as RoomPlayer;
          if (newPlayer.room_id === roomId) {
            setGameState(prev => ({
              ...prev,
              players: [...prev.players.filter(p => p.id !== newPlayer.id), newPlayer]
            }));
            
            // Show join notification
            if (newPlayer.user_id !== session?.user?.id) {
              toast({
                title: "שחקן חדש הצטרף",
                description: `${newPlayer.nickname} הצטרף לקבוצה`,
                duration: 3000
              });
            }
          }
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
          const newGuess = payload.new as RoomGuess;
          if (newGuess.room_id === roomId) {
            // Get player nickname for the guess
            const { data: playerData } = await supabase
              .from('room_players')
              .select('nickname')
              .eq('id', newGuess.player_id)
              .single();
            
            const guessWithNickname = {
              ...newGuess,
              player_nickname: playerData?.nickname || 'Unknown'
            };
            
            setGameState(prev => ({
              ...prev,
              guesses: [...prev.guesses, guessWithNickname].sort((a, b) => a.guess_order - b.guess_order),
              isComplete: newGuess.is_correct || prev.isComplete
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_players'
        },
        (payload) => {
          const updatedPlayer = payload.new as RoomPlayer;
          if (updatedPlayer.room_id === roomId) {
            setGameState(prev => ({
              ...prev,
              players: prev.players.map(p => 
                p.id === updatedPlayer.id ? updatedPlayer : p
              )
            }));
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);
  }, [realtimeChannel, session?.user?.id, toast]);

  const createRoom = async (nickname: string, wordDate: string): Promise<string> => {
    if (!session?.user) throw new Error("משתמש לא מחובר");
    
    setIsLoading(true);
    try {
      // Generate room code using the database function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_room_code');
      
      if (codeError) throw new Error("שגיאה ביצירת קוד חדר");
      
      const roomCode = codeData;
      
      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          word_date: wordDate,
          created_by: session.user.id
        })
        .select()
        .single();
      
      if (roomError) throw new Error("שגיאה ביצירת החדר");
      
      // Join the room as the creator
      const { data: playerData, error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          user_id: session.user.id,
          nickname: nickname
        })
        .select()
        .single();
      
      if (playerError) throw new Error("שגיאה בהצטרפות לחדר");
      
      // Get the current word for this date
      const { data: wordData } = await supabase
        .rpc('get_active_word_for_date', { target_date: wordDate });
      
      const currentWord = wordData && wordData.length > 0 ? wordData[0].word : null;
      
      // Update state
      setGameState({
        room: roomData,
        players: [playerData],
        guesses: [],
        currentPlayer: playerData,
        isComplete: false,
        currentWord
      });
      
      // Setup realtime subscription
      setupRealtimeSubscription(roomData.id);
      
      return roomCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה ביצירת החדר";
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
    if (!session?.user) throw new Error("משתמש לא מחובר");
    
    setIsLoading(true);
    try {
      // Get room data with players
      const { data: roomData, error: roomError } = await supabase
        .rpc('get_room_with_players', { room_code_param: roomCode });
      
      if (roomError || !roomData || roomData.length === 0) {
        throw new Error("החדר לא נמצא או לא פעיל");
      }
      
      const room = {
        id: roomData[0].room_id,
        room_code: roomData[0].room_code,
        word_date: roomData[0].word_date,
        created_by: roomData[0].created_by,
        created_at: new Date().toISOString(),
        is_active: true,
        max_players: 10
      };
      
      // Check if user is already in the room
      const existingPlayer = roomData.find(r => r.user_id === session.user.id);
      
      let currentPlayer: RoomPlayer;
      
      if (existingPlayer && existingPlayer.player_id) {
        // User is already in the room
        currentPlayer = {
          id: existingPlayer.player_id,
          room_id: room.id,
          user_id: session.user.id,
          nickname: existingPlayer.nickname,
          joined_at: existingPlayer.joined_at,
          is_active: true
        };
      } else {
        // Join the room
        const { data: playerData, error: playerError } = await supabase
          .from('room_players')
          .insert({
            room_id: room.id,
            user_id: session.user.id,
            nickname: nickname
          })
          .select()
          .single();
        
        if (playerError) throw new Error("שגיאה בהצטרפות לחדר");
        currentPlayer = playerData;
      }
      
      // Get all players
      const players = roomData
        .filter(r => r.player_id)
        .map(r => ({
          id: r.player_id,
          room_id: room.id,
          user_id: r.user_id,
          nickname: r.nickname,
          joined_at: r.joined_at,
          is_active: true
        }));
      
      // If current player wasn't in the original data, add them
      if (!players.find(p => p.id === currentPlayer.id)) {
        players.push(currentPlayer);
      }
      
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
      
      // Get the current word for this date
      const { data: wordData } = await supabase
        .rpc('get_active_word_for_date', { target_date: room.word_date });
      
      const currentWord = wordData && wordData.length > 0 ? wordData[0].word : null;
      
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
      
      // Setup realtime subscription
      setupRealtimeSubscription(room.id);
      
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
    if (!gameState.room || !gameState.currentPlayer || !session?.user) {
      throw new Error("לא ניתן להכניס ניחוש");
    }
    
    if (gameState.isComplete) {
      throw new Error("המשחק הסתיים");
    }
    
    // Check if word was already guessed in this room
    const existingGuess = gameState.guesses.find(g => g.guess_word === word);
    if (existingGuess) {
      throw new Error(`המילה "${word}" כבר נוחשה על ידי ${existingGuess.player_nickname}`);
    }
    
    try {
      // Calculate similarity using the existing edge function
      const { data: similarityData, error: similarityError } = await supabase.functions.invoke(
        "calculate-similarity", 
        { body: { guess: word, date: gameState.room.word_date } }
      );
      
      if (similarityError) throw new Error("שגיאה בחישוב הדמיון");
      if (similarityData.error) throw new Error(similarityData.error);
      
      const { similarity, rank } = similarityData;
      const isCorrect = similarity >= 0.99; // Adjust threshold as needed
      
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
      
      const { error: insertError } = await supabase
        .from('room_guesses')
        .insert(guessData);
      
      if (insertError) throw new Error("שגיאה בשמירת הניחוש");
      
      // The realtime subscription will handle updating the state
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      throw new Error(errorMessage);
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!gameState.currentPlayer) return;
    
    try {
      await supabase
        .from('room_players')
        .update({ is_active: false })
        .eq('id', gameState.currentPlayer.id);
      
      resetMultiplayerState();
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const resetMultiplayerState = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }
    
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
    resetMultiplayerState
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