import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Guess, GameState, DailyWord, LeaderboardEntry } from "../types/game";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface GameContextType {
  gameState: GameState;
  isLoading: boolean;
  currentWord: string | null;
  leaderboard: LeaderboardEntry[];
  isHistoricalGame: boolean;
  makeGuess: (word: string) => Promise<Guess>;
  resetGame: () => void;
  dailyWords: DailyWord[];
  setWordForDate: (word: string, date: string) => Promise<void>;
  loadHistoricalGame: (date: string) => Promise<void>;
  fetchLeaderboard: (date?: string) => Promise<void>;
  initializeGame: () => Promise<void>;
  getCurrentGameDate: () => string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY_GAME_STATE = "semantle_game_state";
const STORAGE_KEY_CURRENT_GAME = "semantle_current_game_state";

// Helper function to get yesterday's date
const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    isComplete: false,
    wordDate: getYesterdayDate(),
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [dailyWords, setDailyWords] = useState<DailyWord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isHistoricalGame] = useState<boolean>(true); // Always historical now

  // Initialize game
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Load daily words
        const { data, error } = await supabase
          .from('daily_words')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error("Error loading daily words:", error);
        }
        
        let targetWord = "בית"; // Default word
        const yesterdayDate = getYesterdayDate();
        
        if (data && data.length > 0) {
          setDailyWords(data.map(item => ({
            id: item.id,
            word: item.word,
            date: item.date,
            hints: item.hints,
            is_active: item.is_active
          })));
          
          // Look for yesterday's word by default
          const yesterdayWordData = data.find(w => w.date === yesterdayDate && w.is_active);
          
          if (yesterdayWordData) {
            targetWord = yesterdayWordData.word;
          }
        }
        
        // Load saved game state for yesterday's date
        const savedState = localStorage.getItem(STORAGE_KEY_CURRENT_GAME);
        let gameStateToLoad;
        
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Check if saved state is for yesterday, if not create new state
          if (parsedState.wordDate === yesterdayDate) {
            gameStateToLoad = parsedState;
          } else {
            // Old game state from different day - create new one for yesterday
            gameStateToLoad = {
              guesses: [],
              isComplete: false,
              wordDate: yesterdayDate
            };
          }
        } else {
          gameStateToLoad = {
            guesses: [],
            isComplete: false,
            wordDate: yesterdayDate
          };
        }
        
        setCurrentWord(targetWord);
        setGameState(gameStateToLoad);
        
      } catch (error) {
        console.error("Error initializing app:", error);
        
        const yesterdayDate = getYesterdayDate();
        setCurrentWord("בית");
        setGameState({
          guesses: [],
          isComplete: false,
          wordDate: yesterdayDate
        });
        
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת המשחק"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [toast]);

  // Save game state when it changes
  useEffect(() => {
    if (!isLoading && currentWord && gameState.guesses.length >= 0) {
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(gameState));
      
      // Save current game state (could be yesterday or any historical date)
      localStorage.setItem(STORAGE_KEY_CURRENT_GAME, JSON.stringify(gameState));
      
      // Save historical game state for specific date
      if (gameState.wordDate) {
        localStorage.setItem(`game_state_${gameState.wordDate}`, JSON.stringify(gameState));
      }
    }
  }, [gameState, isLoading, currentWord]);

  const makeGuess = async (word: string): Promise<Guess> => {
    if (!currentWord) throw new Error("המשחק לא נטען כראוי");
    if (gameState.isComplete) throw new Error("המשחק הסתיים");
    
    // Enhanced input validation
    const normalizedWord = word.trim();
    if (!normalizedWord) throw new Error("אנא הזן מילה");
    
    // Length validation
    if (normalizedWord.length < 2 || normalizedWord.length > 50) {
      throw new Error("המילה חייבת להיות באורך של 2-50 תווים");
    }

    // Hebrew word validation (allow Hebrew letters, English letters, numbers, spaces, hyphens, dots)
    const hebrewWordRegex = /^[א-תa-zA-Z0-9\s\-.]+$/;
    if (!hebrewWordRegex.test(normalizedWord)) {
      throw new Error("המילה מכילה תווים לא חוקיים");
    }
    
    // Check if word was already guessed - return the existing guess instead of error
    const existingGuess = gameState.guesses.find(g => g.word === normalizedWord);
    if (existingGuess) {
      return existingGuess;
    }

    // Check rate limit if user is authenticated
    if (auth.currentUser) {
      try {
        const { data: rateLimitResult, error: rateLimitError } = await supabase
          .rpc('check_rate_limit', {
            _user_id: auth.currentUser.id,
            _action_type: 'guess_submission',
            _max_requests: 10,
            _window_minutes: 1
          });

        if (rateLimitError) {
          console.warn("Rate limit check failed:", rateLimitError);
        } else if (!rateLimitResult) {
          throw new Error("יותר מדי ניחושים. אנא חכה דקה ונסה שוב");
        }
      } catch (error) {
        console.warn("Rate limit check error:", error);
        // Continue without rate limiting if check fails
      }
    }

    // Format date for the new server (dd/mm/yyyy)
    const gameDate = new Date(`${gameState.wordDate}T12:00:00`);
    const formattedDate = `${gameDate.getDate().toString().padStart(2, '0')}/${(gameDate.getMonth() + 1).toString().padStart(2, '0')}/${gameDate.getFullYear()}`;
    const encodedDate = encodeURIComponent(formattedDate);

    // Make both API calls in parallel
    const [similarityResponse, rankResponse] = await Promise.allSettled([
      // Call old server for similarity via edge function
      supabase.functions.invoke("calculate-similarity", {
        body: { 
          guess: normalizedWord,
          date: gameState.wordDate
        }
      }),
      // Call new server for rank score directly
      fetch(`https://hebrew-w2v-api.onrender.com/rank?word=${encodeURIComponent(normalizedWord)}&date=${encodedDate}`)
    ]);

    // Process similarity response
    if (similarityResponse.status === 'rejected') {
      console.error("Error calculating similarity:", similarityResponse.reason);
      throw new Error("שגיאה בחישוב הדמיון, נסה שוב");
    }

    const { data: similarityData, error: similarityError } = similarityResponse.value;
    if (similarityError) {
      console.error("Error calculating similarity:", similarityError);
      throw new Error("שגיאה בחישוב הדמיון, נסה שוב");
    }

    if (similarityData.error) {
      console.error("API response error:", similarityData.error);
      // Preserve the original API error message for specific error handling in GameBoard
      throw new Error(similarityData.error);
    }

    // Process rank response (optional - don't fail if this doesn't work)
    let rankScore: number | undefined;
    if (rankResponse.status === 'fulfilled') {
      try {
        if (rankResponse.value.ok) {
          const rankData = await rankResponse.value.json();
          // The new server returns rank in the rank field
          if (rankData.rank && rankData.rank > 0) {
            rankScore = rankData.rank;
          }
        } else {
          console.warn("Rank endpoint failed, continuing without rank score");
        }
      } catch (error) {
        console.warn("Error processing rank response, continuing without rank score:", error);
      }
    } else {
      console.warn("Error getting rank score, continuing without rank score:", rankResponse.reason);
    }

    const { similarity, rank, isCorrect } = similarityData;
    
    const newGuess: Guess = {
      word: normalizedWord,
      similarity,
      rank,
      isCorrect,
      rankScore
    };

    const newGuesses = [...gameState.guesses, newGuess];

    const newGameState = {
      ...gameState,
      guesses: newGuesses,
      isComplete: isCorrect
    };

    setGameState(newGameState);

    // Save user's score when game is completed
    if (isCorrect && auth.currentUser) {
      try {
        const { error: scoreError } = await supabase
          .from('daily_scores')
          .upsert({
            user_id: auth.currentUser.id,
            word_date: gameState.wordDate,
            guesses_count: newGuesses.length,
            completion_time: new Date().toISOString()
          }, {
            onConflict: 'user_id,word_date'
          });

        if (scoreError) {
          console.error("Error saving score:", scoreError);
        }
      } catch (error) {
        console.error("Error saving score:", error);
      }
    }

    return newGuess;
  };

  const resetGame = () => {
    if (!gameState.isComplete) return;

    const yesterdayDate = getYesterdayDate();
    setGameState({
      guesses: [],
      isComplete: false,
      wordDate: yesterdayDate
    });
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
      const { data, error: findError } = await supabase
        .from('daily_words')
        .select('*')
        .eq('date', date);
        
      if (findError) throw findError;
      
      let result;
      
      if (data && data.length > 0) {
        result = await supabase
          .from('daily_words')
          .update({
            word,
            created_by: auth.currentUser.id
          })
          .eq('date', date);
      } else {
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
      
      // Update current word if we're setting word for the current game date
      if (date === gameState.wordDate) {
        setCurrentWord(word);
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
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('daily_words')
        .select('*')
        .eq('date', date)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("לא נמצאה מילה לתאריך זה");
      }
      
      // Save current game state before switching
      if (gameState.wordDate && gameState.wordDate !== date) {
        localStorage.setItem(`game_state_${gameState.wordDate}`, JSON.stringify(gameState));
      }
      
      setCurrentWord(data.word);
      
      // Try to load existing historical game state
      const savedHistoricalState = localStorage.getItem(`game_state_${date}`);
      const historicalGameState = savedHistoricalState ? JSON.parse(savedHistoricalState) : {
        guesses: [],
        isComplete: false,
        wordDate: date
      };
      
      setGameState(historicalGameState);
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(historicalGameState));
      localStorage.setItem(STORAGE_KEY_CURRENT_GAME, JSON.stringify(historicalGameState));
      
      toast({
        title: "משחק היסטורי נטען",
        description: `המשחק מתאריך ${date} נטען בהצלחה`
      });
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error loading historical game:", error);
      
      const yesterdayDate = getYesterdayDate();
      const yesterdayState = {
        guesses: [],
        isComplete: false,
        wordDate: yesterdayDate
      };
      
      setGameState(yesterdayState);
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בטעינת המשחק ההיסטורי"
      });
      
      setIsLoading(false);
      throw error;
    }
  };

  const getCurrentGameDate = (): string => {
    return gameState.wordDate;
  };

  const fetchLeaderboard = async (date?: string): Promise<void> => {
    const targetDate = date || gameState.wordDate;
    
    try {
      // Use secure function for today's leaderboard, regular RPC for other dates
      const isToday = targetDate === format(new Date(), 'yyyy-MM-dd');
      
      if (isToday) {
        const { data, error } = await supabase
          .rpc('get_today_leaderboard');
        
        if (error) throw error;
        
        if (data) {
          const formattedLeaderboard: LeaderboardEntry[] = data.map((entry: any) => ({
            username: entry.username,
            userId: entry.user_id,
            guessesCount: entry.guesses_count,
            completionTime: entry.completion_time,
            rank: entry.rank
          }));
          
          setLeaderboard(formattedLeaderboard);
        }
      } else {
        const { data, error } = await supabase
          .rpc('get_leaderboard_for_date', { target_date: targetDate });
          
        if (error) throw error;
        
        if (data) {
          const formattedLeaderboard: LeaderboardEntry[] = data.map((entry: any) => ({
            username: entry.username,
            userId: entry.user_id,
            guessesCount: entry.guesses_count,
            completionTime: entry.completion_time,
            rank: entry.rank
          }));
          
          setLeaderboard(formattedLeaderboard);
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      // Fallback to original query if optimized function fails
      try {
        const { data, error } = await supabase
          .from('daily_scores')
          .select(`
            guesses_count,
            completion_time,
            user_id,
            profiles!daily_scores_user_id_fkey (username)
          `)
          .eq('word_date', targetDate)
          .order('guesses_count', { ascending: true })
          .order('completion_time', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          const formattedLeaderboard: LeaderboardEntry[] = data
            .filter(entry => entry.profiles && entry.profiles.username)
            .map((entry, index) => ({
              username: entry.profiles.username,
              userId: entry.user_id,
              guessesCount: entry.guesses_count,
              completionTime: entry.completion_time,
              rank: index + 1
            }));
          
          setLeaderboard(formattedLeaderboard);
        }
      } catch (fallbackError) {
        console.error("Error in fallback leaderboard fetch:", fallbackError);
      }
    }
  };

  const initializeGame = async () => {
    // Already handled by the main initialization
  };

  useEffect(() => {
    if (gameState.wordDate && !isLoading && currentWord) {
      fetchLeaderboard();
    }
  }, [gameState.wordDate, isLoading, currentWord]);

  return (
    <GameContext.Provider 
      value={{ 
        gameState, 
        isLoading, 
        currentWord, 
        leaderboard,
        isHistoricalGame,
        makeGuess, 
        resetGame,
        dailyWords,
        setWordForDate,
        loadHistoricalGame,
        fetchLeaderboard,
        initializeGame,
        getCurrentGameDate
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
