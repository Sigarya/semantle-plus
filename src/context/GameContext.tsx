import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Guess, GameState, DailyWord, LeaderboardEntry } from "../types/game";
import { isValidHebrewWord } from "../lib/utils";
import { getTodayInIsrael, isToday } from "../lib/dateUtils";
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

const STORAGE_KEY_GAME_STATE = "semantle_game_state";
const STORAGE_KEY_TODAY_GAME = "semantle_today_game_state";
const STORAGE_KEY_HISTORICAL_FLAG = "semantle_historical_game";
const STORAGE_KEY_HISTORICAL_STATES = "semantle_historical_states";

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
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

  // Load today's word and all daily words
  useEffect(() => {
    const loadDailyWords = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_words')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          setDailyWords(data.map(item => ({
            id: item.id,
            word: item.word,
            date: item.date,
            hints: item.hints,
            is_active: item.is_active
          })));
          
          // Get today's date in UTC
          const today = new Date().toISOString().split('T')[0];
          const todayWordData = data.find(w => w.date === today && w.is_active);
          
          if (todayWordData) {
            setTodayWord(todayWordData.word);
          } else {
            // Fallback to a default word if no word is set for today
            setTodayWord("בית");
            console.log("No active word found for today, using default word: בית");
            
            // Insert default word for today if admin
            if (currentUser?.isAdmin) {
              try {
                await supabase
                  .from('daily_words')
                  .upsert({
                    word: "בית",
                    date: today,
                    is_active: true,
                    created_by: currentUser.id
                  });
                console.log("Default word inserted for today");
              } catch (insertError) {
                console.error("Error inserting default word:", insertError);
              }
            }
          }
          
          // Set loading to false now that we have a word
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading daily words:", error);
        // Fallback in case of error
        setTodayWord("בית");
        setIsLoading(false);
      }
    };
    
    loadDailyWords();
  }, [currentUser]);

  // Initialize game - can be called explicitly to force initialization
  const initializeGame = useCallback(async () => {
    setIsLoading(true);
    console.log("Initializing game...");
    
    try {
      // Get today's date in UTC
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we have a historical game flag
      const isHistorical = localStorage.getItem(STORAGE_KEY_HISTORICAL_FLAG) === "true";
      setIsHistoricalGame(isHistorical);
      
      // Try to load saved game state
      let savedStateObj;
      
      if (isHistorical) {
        // If we're in a historical game, try to load that state
        const savedState = localStorage.getItem(STORAGE_KEY_GAME_STATE);
        savedStateObj = savedState ? JSON.parse(savedState) : null;
        console.log("Loading historical game:", savedStateObj?.wordDate);
        
        // If we don't have a valid saved state for historical game, reset to today's game
        if (!savedStateObj || !savedStateObj.wordDate) {
          console.log("Invalid historical game state, resetting to today's game");
          localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
          setIsHistoricalGame(false);
          
          // Try to load today's saved state
          const savedTodayState = localStorage.getItem(STORAGE_KEY_TODAY_GAME);
          savedStateObj = savedTodayState ? JSON.parse(savedTodayState) : null;
          
          // If no valid today state either, create new
          if (!savedStateObj || savedStateObj.wordDate !== today) {
            savedStateObj = {
              guesses: [],
              isComplete: false,
              wordDate: today
            };
          }
        }
        
        // Make sure we have today's game state saved
        const savedTodayState = localStorage.getItem(STORAGE_KEY_TODAY_GAME);
        if (savedTodayState) {
          const todayStateObj = JSON.parse(savedTodayState);
          if (todayStateObj.wordDate === today) {
            setTodayGameState(todayStateObj);
          }
        }
      } else {
        // We're loading today's game
        console.log("Loading today's game");
        
        // Try to load today's saved state
        const savedState = localStorage.getItem(STORAGE_KEY_TODAY_GAME);
        savedStateObj = savedState ? JSON.parse(savedState) : null;
        
        // CRITICAL FIX: If saved state is not for today, clear guesses and create a new state
        if (!savedStateObj || savedStateObj.wordDate !== today) {
          console.log("Creating new game state for today or clearing old guesses");
          savedStateObj = {
            guesses: [],
            isComplete: false,
            wordDate: today
          };
          
          // Clear the old state from localStorage
          localStorage.removeItem(STORAGE_KEY_TODAY_GAME);
        }
      }
      
      // Set the game state from what we loaded or created
      setGameState(savedStateObj);
      
      // If we have a date that doesn't match today, we need to fetch the word for that date
      if (savedStateObj.wordDate !== today) {
        const { data, error } = await supabase
          .from('daily_words')
          .select('word')
          .eq('date', savedStateObj.wordDate)
          .eq('is_active', true)
          .single();
          
        if (error) {
          console.error("Error fetching word for date:", error);
          throw new Error("שגיאה בטעינת המילה");
        }
        
        if (data) {
          console.log(`Setting target word for ${savedStateObj.wordDate}: ${data.word}`);
          setTodayWord(data.word);
        } else {
          console.error("No word found for date:", savedStateObj.wordDate);
          throw new Error(`לא נמצאה מילה לתאריך ${savedStateObj.wordDate}`);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing game:", error);
      
      // Handle error by reverting to today's game
      const today = new Date().toISOString().split('T')[0];
      
      // Create a clean new game state for today
      const newGameState = {
        guesses: [],
        isComplete: false,
        wordDate: today
      };
      
      setGameState(newGameState);
      setIsHistoricalGame(false);
      localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
      
      // Find today's word again
      const todayWordData = dailyWords.find(w => w.date === today && w.is_active);
      if (todayWordData) {
        setTodayWord(todayWordData.word);
      }
      
      setIsLoading(false);
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת המשחק"
      });
    }
  }, [toast, dailyWords]);

  // Load or initialize game
  useEffect(() => {
    if (todayWord) {
      initializeGame();
    }
  }, [todayWord, initializeGame]);

  // Save game state when it changes
  useEffect(() => {
    if (!isLoading) {
      // Always save the current game state
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(gameState));
      
      // If this is today's game, also save it as today's game state
      if (!isHistoricalGame) {
        const today = new Date().toISOString().split('T')[0];
        if (gameState.wordDate === today) {
          localStorage.setItem(STORAGE_KEY_TODAY_GAME, JSON.stringify(gameState));
          setTodayGameState(gameState);
        }
      }
      // If this is a historical game, save it in the historical states record
      else {
        const savedHistoricalStates = localStorage.getItem(STORAGE_KEY_HISTORICAL_STATES);
        let historicalStates = savedHistoricalStates ? JSON.parse(savedHistoricalStates) : {};
        historicalStates[gameState.wordDate] = gameState;
        localStorage.setItem(STORAGE_KEY_HISTORICAL_STATES, JSON.stringify(historicalStates));
      }
    }
  }, [gameState, isLoading, isHistoricalGame]);

  const makeGuess = async (word: string): Promise<Guess> => {
    if (!todayWord) throw new Error("המשחק לא נטען כראוי");
    if (gameState.isComplete) throw new Error("המשחק הסתיים");
    
    // Check if word was already guessed
    if (gameState.guesses.some(g => g.word === word)) {
      throw new Error("כבר ניחשת את המילה הזאת");
    }

    // Call our edge function to calculate similarity using the real API
    // Pass the target date for historical games
    const { data, error } = await supabase.functions.invoke("calculate-similarity", {
      body: { 
        guess: word,
        date: gameState.wordDate // Pass the target date
      }
    });

    if (error) {
      console.error("Error calculating similarity:", error);
      throw new Error("שגיאה בחישוב הדמיון");
    }

    // Handle API errors returned in the response
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

    // Add the new guess to the *end* of the array (chronological order)
    const newGuesses = [...gameState.guesses, newGuess];

    setGameState({
      ...gameState,
      guesses: newGuesses,
      isComplete: isCorrect
    });

    // Update user stats if authenticated and game is completed
    if (isCorrect && currentUser) {
      try {
        // Update user_stats
        const { data: stats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('id', currentUser.id)
          .single();
          
        if (statsError) {
          console.error("Error fetching stats:", statsError);
        } else if (stats) {
          const newGamesPlayed = stats.games_played + 1;
          const newGamesWon = stats.games_won + 1;
          const newWinStreak = stats.win_streak + 1;
          const newBestStreak = Math.max(stats.best_streak, newWinStreak);
          const newGuessCount = newGuesses.length;
          const newTotalGuesses = stats.total_guesses + newGuessCount;
          const newBestGuessCount = stats.best_guess_count 
            ? Math.min(stats.best_guess_count, newGuessCount) 
            : newGuessCount;
          
          const { error: updateError } = await supabase
            .from('user_stats')
            .update({
              games_played: newGamesPlayed,
              games_won: newGamesWon,
              win_streak: newWinStreak,
              best_streak: newBestStreak,
              best_guess_count: newBestGuessCount,
              total_guesses: newTotalGuesses,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
            
          if (updateError) {
            console.error("Error updating stats:", updateError);
          }
        }
        
        // Record the score in daily_scores
        const { error: scoreError } = await supabase
          .from('daily_scores')
          .upsert({
            user_id: currentUser.id,
            word_date: gameState.wordDate,
            guesses_count: newGuesses.length,
            completion_time: new Date().toISOString()
          });
          
        if (scoreError) {
          console.error("Error recording score:", scoreError);
        }
        
        // Update leaderboard after recording the score
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
    if (!currentUser?.isAdmin) {
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
            created_by: currentUser.id
          })
          .eq('date', date);
      } else {
        // Add new word
        result = await supabase
          .from('daily_words')
          .insert({
            word,
            date,
            created_by: currentUser.id
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
      
      // Look for existing saved state for this date
      const savedHistoricalStates = localStorage.getItem(STORAGE_KEY_HISTORICAL_STATES);
      let historicalStates = savedHistoricalStates ? JSON.parse(savedHistoricalStates) : {};
      
      // If we have a saved state for this date, use it
      if (historicalStates[date]) {
        console.log("Using saved historical state for date:", date);
        setGameState(historicalStates[date]);
      } else {
        // Otherwise create a new game state for this date
        console.log("Creating new game state for historical date:", date);
        setGameState({
          guesses: [],
          isComplete: false,
          wordDate: date
        });
      }
      
      // Save the current state to localStorage
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(
        historicalStates[date] || {
          guesses: [],
          isComplete: false,
          wordDate: date
        }
      ));
      
      toast({
        title: "משחק היסטורי נטען",
        description: `המשחק מתאריך ${date} נטען בהצלחה`
      });
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error loading historical game:", error);
      
      // Revert to today's game in case of error
      const today = new Date().toISOString().split('T')[0];
      
      // If we have a saved today game state, use it
      if (todayGameState && todayGameState.wordDate === today) {
        setGameState(todayGameState);
      } else {
        // Otherwise create a new game state
        setGameState({
          guesses: [],
          isComplete: false,
          wordDate: today
        });
      }
      
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
  const returnToTodayGame = () => {
    const today = new Date().toISOString().split('T')[0];
    console.log("Returning to today's game");
    
    // If we have a saved today game state, use it
    if (todayGameState && todayGameState.wordDate === today) {
      setGameState(todayGameState);
      console.log("Using saved state for today's game");
    } else {
      // Otherwise create a new game state
      setGameState({
        guesses: [],
        isComplete: false,
        wordDate: today
      });
      console.log("Creating new state for today's game");
    }
    
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
      // Join daily_scores with profiles to get usernames
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

  // Load leaderboard when component mounts or game state changes
  useEffect(() => {
    if (gameState.wordDate && !isLoading) {
      fetchLeaderboard();
    }
  }, [gameState.wordDate, isLoading]);

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
