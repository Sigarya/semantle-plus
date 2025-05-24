import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Guess, GameState, DailyWord, LeaderboardEntry } from "../types/game";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface GameContextType {
  gameState: GameState;
  isLoading: boolean;
  todayWord: string | null;
  leaderboard: LeaderboardEntry[];
  isHistoricalGame: boolean;
  makeGuess: (word: string) => Promise<Guess>;
  resetGame: () => void;
  dailyWords: DailyWord[];
  setWordForDate: (word: string, date: string) => Promise<void>;
  loadHistoricalGame: (date: string) => Promise<void>;
  fetchLeaderboard: (date?: string) => Promise<void>;
  initializeGame: () => Promise<void>;
  returnToTodayGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY_GUEST_ID = "semantle_guest_id";
const STORAGE_KEY_GAME_STATE = "semantle_game_state";
const STORAGE_KEY_TODAY_GAME = "semantle_today_game_state";
const STORAGE_KEY_HISTORICAL_FLAG = "semantle_historical_game";

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    isComplete: false,
    wordDate: new Date().toISOString().split('T')[0],
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todayWord, setTodayWord] = useState<string | null>(null);
  const [dailyWords, setDailyWords] = useState<DailyWord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isHistoricalGame, setIsHistoricalGame] = useState<boolean>(false);
  const [todayGameState, setTodayGameState] = useState<GameState | null>(null);

  // Generate or get guest ID for non-authenticated users
  const getGuestId = () => {
    let guestId = localStorage.getItem(STORAGE_KEY_GUEST_ID);
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem(STORAGE_KEY_GUEST_ID, guestId);
    }
    return guestId;
  };

  // Get current user identifier (authenticated user ID or guest ID)
  const getCurrentUserId = () => {
    return auth.currentUser ? auth.currentUser.id : getGuestId();
  };

  // Save guesses to server - with proper error handling
  const saveGuessesToServer = async (guesses: Guess[], wordDate: string) => {
    try {
      const userId = getCurrentUserId();
      console.log("Saving guesses to server for user:", userId, "date:", wordDate, "guesses count:", guesses.length);
      
      // For authenticated users, use user_guesses table
      if (auth.currentUser) {
        // First, delete existing guesses for this user and date
        const { error: deleteError } = await supabase
          .from('user_guesses')
          .delete()
          .eq('user_id', auth.currentUser.id)
          .eq('word_date', wordDate);
          
        if (deleteError) {
          console.error("Error deleting existing guesses:", deleteError);
          return;
        }
        
        // Then insert new guesses if any exist
        if (guesses.length > 0) {
          const guessesToSave = guesses.map((guess, index) => ({
            user_id: auth.currentUser!.id,
            word_date: wordDate,
            guess_word: guess.word,
            similarity: guess.similarity,
            rank: guess.rank || null,
            is_correct: guess.isCorrect,
            guess_order: index + 1
          }));
          
          const { error: insertError } = await supabase
            .from('user_guesses')
            .insert(guessesToSave);
            
          if (insertError) {
            console.error("Error saving guesses:", insertError);
          } else {
            console.log("Successfully saved", guesses.length, "guesses to server");
          }
        }
      } else {
        // For guest users, save to localStorage as fallback
        const guestGameKey = `guest_game_${wordDate}_${userId}`;
        localStorage.setItem(guestGameKey, JSON.stringify(guesses));
        console.log("Saved guest guesses to localStorage");
      }
    } catch (error) {
      console.error("Error in saveGuessesToServer:", error);
    }
  };

  // Load guesses from server - with proper error handling
  const loadGuessesFromServer = async (wordDate: string): Promise<Guess[]> => {
    try {
      const userId = getCurrentUserId();
      console.log("Loading guesses from server for user:", userId, "date:", wordDate);
      
      // For authenticated users, load from user_guesses table
      if (auth.currentUser) {
        const { data, error } = await supabase
          .from('user_guesses')
          .select('*')
          .eq('user_id', auth.currentUser.id)
          .eq('word_date', wordDate)
          .order('guess_order', { ascending: true });
          
        if (error) {
          console.error("Error loading guesses:", error);
          return [];
        }
        
        if (data && data.length > 0) {
          const loadedGuesses = data.map(guess => ({
            word: guess.guess_word,
            similarity: Number(guess.similarity),
            rank: guess.rank,
            isCorrect: guess.is_correct
          }));
          
          console.log("Successfully loaded", loadedGuesses.length, "guesses from server:", loadedGuesses);
          return loadedGuesses;
        }
      } else {
        // For guest users, load from localStorage
        const guestGameKey = `guest_game_${wordDate}_${userId}`;
        const savedGuesses = localStorage.getItem(guestGameKey);
        if (savedGuesses) {
          const loadedGuesses = JSON.parse(savedGuesses);
          console.log("Loaded guest guesses from localStorage:", loadedGuesses);
          return loadedGuesses;
        }
      }
      
      console.log("No guesses found for this user and date");
      return [];
    } catch (error) {
      console.error("Error in loadGuessesFromServer:", error);
      return [];
    }
  };

  // Load daily words and initialize game - wait for auth to be ready
  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      // Wait for auth to finish loading
      if (auth.isLoading) {
        console.log("Waiting for auth to finish loading...");
        return;
      }
      
      try {
        console.log("Initializing app with auth ready. Current user:", auth.currentUser?.id);
        setIsLoading(true);
        
        // Load daily words
        const { data, error } = await supabase
          .from('daily_words')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error("Error loading daily words:", error);
          throw error;
        }
        
        if (data && mounted) {
          setDailyWords(data.map(item => ({
            id: item.id,
            word: item.word,
            date: item.date,
            hints: item.hints,
            is_active: item.is_active
          })));
          
          const today = new Date().toISOString().split('T')[0];
          const todayWordData = data.find(w => w.date === today && w.is_active);
          
          let targetWord = todayWordData?.word || "בית";
          
          // Check if we're in historical mode
          const isHistorical = localStorage.getItem(STORAGE_KEY_HISTORICAL_FLAG) === "true";
          setIsHistoricalGame(isHistorical);
          
          let gameStateToLoad;
          let wordForGame = targetWord;
          
          if (isHistorical) {
            const savedState = localStorage.getItem(STORAGE_KEY_GAME_STATE);
            gameStateToLoad = savedState ? JSON.parse(savedState) : null;
            
            if (!gameStateToLoad || !gameStateToLoad.wordDate) {
              localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
              setIsHistoricalGame(false);
              gameStateToLoad = null;
            } else {
              const historicalWordData = data.find(w => w.date === gameStateToLoad.wordDate && w.is_active);
              if (historicalWordData) {
                wordForGame = historicalWordData.word;
              }
            }
          }
          
          if (!gameStateToLoad) {
            // Load today's game from server
            console.log("Loading today's game from server");
            const serverGuesses = await loadGuessesFromServer(today);
            gameStateToLoad = {
              guesses: serverGuesses,
              isComplete: serverGuesses.some(g => g.isCorrect),
              wordDate: today
            };
            console.log("Using server guesses for today:", gameStateToLoad);
          }
          
          if (mounted) {
            setTodayWord(wordForGame);
            setGameState(gameStateToLoad);
            setIsLoading(false);
            console.log("App initialized successfully with word:", wordForGame, "and state:", gameStateToLoad);
          }
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        
        if (mounted) {
          const today = new Date().toISOString().split('T')[0];
          setTodayWord("בית");
          setGameState({
            guesses: [],
            isComplete: false,
            wordDate: today
          });
          setIsHistoricalGame(false);
          localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
          setIsLoading(false);
          
          toast({
            variant: "destructive",
            title: "שגיאה",
            description: "אירעה שגיאה בטעינת המשחק"
          });
        }
      }
    };
    
    initializeApp();
    
    return () => {
      mounted = false;
    };
  }, [auth.isLoading, auth.currentUser?.id, toast]);

  // Save game state when it changes
  useEffect(() => {
    if (!isLoading && todayWord && gameState.guesses.length >= 0) {
      console.log("Saving game state:", gameState);
      
      // Save to server
      saveGuessesToServer(gameState.guesses, gameState.wordDate);
      
      // Also save locally as backup
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(gameState));
      
      if (!isHistoricalGame) {
        const today = new Date().toISOString().split('T')[0];
        if (gameState.wordDate === today) {
          localStorage.setItem(STORAGE_KEY_TODAY_GAME, JSON.stringify(gameState));
          setTodayGameState(gameState);
        }
      }
    }
  }, [gameState, isLoading, isHistoricalGame, todayWord]);

  const makeGuess = async (word: string): Promise<Guess> => {
    if (!todayWord) throw new Error("המשחק לא נטען כראוי");
    if (gameState.isComplete) throw new Error("המשחק הסתיים");
    
    // Check if word was already guessed
    if (gameState.guesses.some(g => g.word === word)) {
      throw new Error("כבר ניחשת את המילה הזאת");
    }

    // Call our edge function to calculate similarity using the real API
    const { data, error } = await supabase.functions.invoke("calculate-similarity", {
      body: { 
        guess: word,
        date: gameState.wordDate
      }
    });

    if (error) {
      console.error("Error calculating similarity:", error);
      throw new Error("שגיאה בחישוב הדמיון");
    }

    if (data.error) {
      console.error("API response error:", data.error);
      throw new Error(data.error);
    }

    const { similarity, rank, isCorrect } = data;
    
    const newGuess: Guess = {
      word,
      similarity,
      rank,
      isCorrect
    };

    const newGuesses = [...gameState.guesses, newGuess];

    setGameState({
      ...gameState,
      guesses: newGuesses,
      isComplete: isCorrect
    });

    // Update user stats if authenticated and game is completed
    if (isCorrect && auth.currentUser) {
      try {
        const { data: stats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('id', auth.currentUser.id)
          .single();
          
        if (statsError && statsError.code !== 'PGRST116') {
          console.error("Error fetching stats:", statsError);
        } else {
          let statsToUpdate;
          
          if (stats) {
            const newGamesPlayed = stats.games_played + 1;
            const newGamesWon = stats.games_won + 1;
            const newWinStreak = stats.win_streak + 1;
            const newBestStreak = Math.max(stats.best_streak, newWinStreak);
            const newGuessCount = newGuesses.length;
            const newTotalGuesses = stats.total_guesses + newGuessCount;
            const newBestGuessCount = stats.best_guess_count 
              ? Math.min(stats.best_guess_count, newGuessCount) 
              : newGuessCount;
            
            statsToUpdate = {
              games_played: newGamesPlayed,
              games_won: newGamesWon,
              win_streak: newWinStreak,
              best_streak: newBestStreak,
              best_guess_count: newBestGuessCount,
              total_guesses: newTotalGuesses,
              updated_at: new Date().toISOString()
            };
            
            const { error: updateError } = await supabase
              .from('user_stats')
              .update(statsToUpdate)
              .eq('id', auth.currentUser.id);
              
            if (updateError) {
              console.error("Error updating stats:", updateError);
            }
          } else {
            // Create new stats entry
            statsToUpdate = {
              id: auth.currentUser.id,
              games_played: 1,
              games_won: 1,
              win_streak: 1,
              best_streak: 1,
              best_guess_count: newGuesses.length,
              total_guesses: newGuesses.length
            };
            
            const { error: insertError } = await supabase
              .from('user_stats')
              .insert(statsToUpdate);
              
            if (insertError) {
              console.error("Error creating stats:", insertError);
            }
          }
        }
        
        const { error: scoreError } = await supabase
          .from('daily_scores')
          .upsert({
            user_id: auth.currentUser.id,
            word_date: gameState.wordDate,
            guesses_count: newGuesses.length,
            completion_time: new Date().toISOString()
          });
          
        if (scoreError) {
          console.error("Error recording score:", scoreError);
        }
        
        fetchLeaderboard(gameState.wordDate);
        
      } catch (error) {
        console.error("Error updating user stats:", error);
      }
    }

    return newGuess;
  };

  const resetGame = () => {
    // Only allow resetting if the game is complete
    if (!gameState.isComplete) return;

    const today = new Date().toISOString().split('T')[0];
    setGameState({
      guesses: [],
      isComplete: false,
      wordDate: today
    });
    
    // If this was a historical game, revert to today's game
    if (isHistoricalGame) {
      setIsHistoricalGame(false);
      localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
    }
  };

  const setWordForDate = async (word: string, date: string): Promise<void> => {
    if (!auth.currentUser?.isAdmin) {
      toast({
        variant: "destructive",
        title: "פעולה נדחתה",
        description: "אין לך הרשאה לבצע פעולה זו"
      });
      throw new Error("אין לך הרשאה לבצע פעולה זו");
    }
    
    try {
      // Check if we already have a word for this date
      const { data, error: findError } = await supabase
        .from('daily_words')
        .select('*')
        .eq('date', date);
        
      if (findError) throw findError;
      
      let result;
      
      if (data && data.length > 0) {
        // Update existing word
        result = await supabase
          .from('daily_words')
          .update({
            word,
            created_by: auth.currentUser.id
          })
          .eq('date', date);
      } else {
        // Add new word
        result = await supabase
          .from('daily_words')
          .insert({
            word,
            date,
            created_by: auth.currentUser.id
          });
      }
      
      if (result.error) throw result.error;
      
      // Refresh daily words list
      const { data: updatedWords, error: refreshError } = await supabase
        .from('daily_words')
        .select('*')
        .order('date', { ascending: false });
        
      if (refreshError) throw refreshError;
      
      if (updatedWords) {
        setDailyWords(updatedWords.map(item => ({
          id: item.id,
          word: item.word,
          date: item.date,
          hints: item.hints,
          is_active: item.is_active
        })));
      }
      
      // If this is today's word, update it
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        setTodayWord(word);
      }
      
      toast({
        title: "מילה נשמרה",
        description: `המילה "${word}" נקבעה לתאריך ${date}`
      });
    } catch (error: any) {
      console.error("Error setting word for date:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message
      });
      throw error;
    }
  };

  const loadHistoricalGame = async (date: string): Promise<void> => {
    console.log("Loading historical game for date:", date);
    setIsLoading(true);
    
    try {
      // Find the word for the given date
      const { data, error } = await supabase
        .from('daily_words')
        .select('*')
        .eq('date', date)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("לא נמצאה מילה לתאריך זה");
      }
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Save today's game state if we have one and are not already in historical mode
      if (!isHistoricalGame && date !== today && gameState.wordDate === today) {
        localStorage.setItem(STORAGE_KEY_TODAY_GAME, JSON.stringify(gameState));
        setTodayGameState(gameState);
        console.log("Saved today's game state before loading historical game");
      }
      
      // Set the historical game flag
      localStorage.setItem(STORAGE_KEY_HISTORICAL_FLAG, "true");
      setIsHistoricalGame(true);
      
      // Update todayWord to be the word for the selected date
      setTodayWord(data.word);
      console.log("Set target word for historical game:", data.word);
      
      // Load guesses from server for this date
      const serverGuesses = await loadGuessesFromServer(date);
      const historicalGameState = {
        guesses: serverGuesses,
        isComplete: serverGuesses.some(g => g.isCorrect),
        wordDate: date
      };
      
      setGameState(historicalGameState);
      
      // Save the current state to localStorage
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(historicalGameState));
      
      toast({
        title: "משחק היסטורי נטען",
        description: `המשחק מתאריך ${date} נטען בהצלחה`
      });
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error loading historical game:", error);
      
      // Revert to today's game in case of error
      const today = new Date().toISOString().split('T')[0];
      
      // Load today's game from server
      const serverGuesses = await loadGuessesFromServer(today);
      const todayState = {
        guesses: serverGuesses,
        isComplete: serverGuesses.some(g => g.isCorrect),
        wordDate: today
      };
      
      setGameState(todayState);
      setIsHistoricalGame(false);
      localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בטעינת המשחק ההיסטורי"
      });
      
      setIsLoading(false);
      throw error;
    }
  };

  // Function to return to today's game
  const returnToTodayGame = async () => {
    const today = new Date().toISOString().split('T')[0];
    console.log("Returning to today's game");
    
    // Load today's game from server
    const serverGuesses = await loadGuessesFromServer(today);
    const todayGameStateToUse = {
      guesses: serverGuesses,
      isComplete: serverGuesses.some(g => g.isCorrect),
      wordDate: today
    };
    
    setGameState(todayGameStateToUse);
    setIsHistoricalGame(false);
    localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
    
    // Reload today's word
    const todayWordData = dailyWords.find(w => w.date === today && w.is_active);
    if (todayWordData) {
      setTodayWord(todayWordData.word);
      console.log("Set today's word to:", todayWordData.word);
    }
    
    toast({
      title: "חזרה למשחק היומי",
      description: "המשחק היומי נטען בהצלחה"
    });
  };

  const fetchLeaderboard = async (date?: string): Promise<void> => {
    const targetDate = date || gameState.wordDate;
    
    try {
      const { data, error } = await supabase
        .from('daily_scores')
        .select(`
          guesses_count,
          completion_time,
          user_id,
          profiles (username)
        `)
        .eq('word_date', targetDate)
        .order('guesses_count', { ascending: true })
        .order('completion_time', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        const formattedLeaderboard: LeaderboardEntry[] = data.map((entry, index) => ({
          username: entry.profiles.username,
          userId: entry.user_id,
          guessesCount: entry.guesses_count,
          completionTime: entry.completion_time,
          rank: index + 1
        }));
        
        setLeaderboard(formattedLeaderboard);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const initializeGame = async () => {
    // This function is now mostly handled by the main useEffect
    // Keep it for backward compatibility but make it a no-op
    console.log("initializeGame called - handled by main initialization");
  };

  // Load leaderboard when component mounts or game state changes
  useEffect(() => {
    if (gameState.wordDate && !isLoading && todayWord) {
      fetchLeaderboard();
    }
  }, [gameState.wordDate, isLoading, todayWord]);

  return (
    <GameContext.Provider 
      value={{ 
        gameState, 
        isLoading, 
        todayWord, 
        leaderboard,
        isHistoricalGame,
        makeGuess, 
        resetGame,
        dailyWords,
        setWordForDate,
        loadHistoricalGame,
        fetchLeaderboard,
        initializeGame,
        returnToTodayGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
