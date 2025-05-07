import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Guess, GameState, DailyWord, LeaderboardEntry } from "../types/game";
import { isValidHebrewWord } from "../lib/utils";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface GameContextType {
  gameState: GameState;
  isLoading: boolean;
  todayWord: string | null;
  leaderboard: LeaderboardEntry[];
  makeGuess: (word: string) => Promise<Guess>;
  resetGame: () => void;
  dailyWords: DailyWord[];
  setWordForDate: (word: string, date: string) => Promise<void>;
  loadHistoricalGame: (date: string) => Promise<void>;
  fetchLeaderboard: (date?: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

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
          
          // Get today's date in YYYY-MM-DD format
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

  // Load or initialize game
  useEffect(() => {
    const loadGame = async () => {
      setIsLoading(true);
      
      // Try to load saved game state
      const savedState = localStorage.getItem("semantle_game_state");
      const savedStateObj = savedState ? JSON.parse(savedState) : null;
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      if (savedStateObj && savedStateObj.wordDate === today) {
        // If we have a saved state and it's from today, use it
        setGameState(savedStateObj);
      } else {
        // Otherwise start a new game
        setGameState({
          guesses: [],
          isComplete: false,
          wordDate: today
        });
      }
      
      setIsLoading(false);
    };

    if (todayWord) {
      loadGame();
    }
  }, [todayWord]);

  // Save game state when it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("semantle_game_state", JSON.stringify(gameState));
    }
  }, [gameState, isLoading]);

  const makeGuess = async (word: string): Promise<Guess> => {
    if (!todayWord) throw new Error("המשחק לא נטען כראוי");
    if (gameState.isComplete) throw new Error("המשחק הסתיים");
    
    // Check if word was already guessed
    if (gameState.guesses.some(g => g.word === word)) {
      throw new Error("כבר ניחשת את המילה הזאת");
    }

    // Call our edge function to calculate similarity using the real API
    const { data, error } = await supabase.functions.invoke("calculate-similarity", {
      body: { guess: word }
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

    const newGuesses = [...gameState.guesses, newGuess];
    
    // Sort guesses by similarity (descending)
    newGuesses.sort((a, b) => b.similarity - a.similarity);

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
      
      // Set the game state to a new game with the historical date
      setTodayWord(data.word);
      setGameState({
        guesses: [],
        isComplete: false,
        wordDate: date
      });
      
      toast({
        title: "משחק היסטורי נטען",
        description: `המשחק מתאריך ${date} נטען בהצלחה`
      });
    } catch (error: any) {
      console.error("Error loading historical game:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message
      });
      throw error;
    }
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
        makeGuess, 
        resetGame,
        dailyWords,
        setWordForDate,
        loadHistoricalGame,
        fetchLeaderboard
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
