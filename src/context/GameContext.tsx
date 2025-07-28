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
        
        if (data && data.length > 0) {
          setDailyWords(data.map(item => ({
            id: item.id,
            word: item.word,
            date: item.date,
            hints: item.hints,
            is_active: item.is_active
          })));
          
          const today = new Date().toISOString().split('T')[0];
          const todayWordData = data.find(w => w.date === today && w.is_active);
          
          if (todayWordData) {
            targetWord = todayWordData.word;
          }
        }
        
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
          } else if (data) {
            const historicalWordData = data.find(w => w.date === gameStateToLoad.wordDate && w.is_active);
            if (historicalWordData) {
              wordForGame = historicalWordData.word;
            }
          }
        }
        
        if (!gameStateToLoad) {
          // Load today's game from localStorage
          const today = new Date().toISOString().split('T')[0];
          const savedTodayState = localStorage.getItem(STORAGE_KEY_TODAY_GAME);
          
          // Check if saved state is from today, if not create new state
          if (savedTodayState) {
            const parsedState = JSON.parse(savedTodayState);
            if (parsedState.wordDate === today) {
              gameStateToLoad = parsedState;
            } else {
              // Old game state from previous day - create new one
              gameStateToLoad = {
                guesses: [],
                isComplete: false,
                wordDate: today
              };
            }
          } else {
            gameStateToLoad = {
              guesses: [],
              isComplete: false,
              wordDate: today
            };
          }
        }
        
        setTodayWord(wordForGame);
        setGameState(gameStateToLoad);
        
      } catch (error) {
        console.error("Error initializing app:", error);
        
        const today = new Date().toISOString().split('T')[0];
        setTodayWord("בית");
        setGameState({
          guesses: [],
          isComplete: false,
          wordDate: today
        });
        setIsHistoricalGame(false);
        localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
        
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
    if (!isLoading && todayWord && gameState.guesses.length >= 0) {
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(gameState));
      
      if (!isHistoricalGame) {
        const today = new Date().toISOString().split('T')[0];
        if (gameState.wordDate === today) {
          localStorage.setItem(STORAGE_KEY_TODAY_GAME, JSON.stringify(gameState));
        }
      }
      
      // Save historical game state for specific date
      if (isHistoricalGame && gameState.wordDate) {
        localStorage.setItem(`game_state_${gameState.wordDate}`, JSON.stringify(gameState));
      }
    }
  }, [gameState, isLoading, isHistoricalGame, todayWord]);

  const makeGuess = async (word: string): Promise<Guess> => {
    if (!todayWord) throw new Error("המשחק לא נטען כראוי");
    if (gameState.isComplete) throw new Error("המשחק הסתיים");
    
    // Normalize word input
    const normalizedWord = word.trim();
    if (!normalizedWord) throw new Error("אנא הזן מילה");
    
    // Check if word was already guessed
    if (gameState.guesses.some(g => g.word === normalizedWord)) {
      throw new Error("כבר ניחשת את המילה הזאת");
    }

    // Format date for the new server (dd/mm/yyyy)
    const gameDate = new Date(gameState.wordDate + 'T12:00:00');
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
      throw new Error("שגיאה בחישוב הדמיון, נסה שוב");
    }

    // Process rank response
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
          throw new Error("שגיאה בחישוב הדמיון, נסה שוב");
        }
      } catch (error) {
        console.error("Error processing rank response:", error);
        throw new Error("שגיאה בחישוב הדמיון, נסה שוב");
      }
    } else {
      console.error("Error getting rank score:", rankResponse.reason);
      throw new Error("שגיאה בחישוב הדמיון, נסה שוב");
    }

    const { similarity, rank, isCorrect } = similarityData;
    
    const newGuess: Guess = {
      word: normalizedWord,
      similarity,
      rank,
      isCorrect,
      rankScore: rankScore
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

    const today = new Date().toISOString().split('T')[0];
    setGameState({
      guesses: [],
      isComplete: false,
      wordDate: today
    });
    
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
      
      const today = new Date().toISOString().split('T')[0];
      
      if (!isHistoricalGame && date !== today && gameState.wordDate === today) {
        localStorage.setItem(STORAGE_KEY_TODAY_GAME, JSON.stringify(gameState));
      }
      
      localStorage.setItem(STORAGE_KEY_HISTORICAL_FLAG, "true");
      setIsHistoricalGame(true);
      
      setTodayWord(data.word);
      
      // Try to load existing historical game state
      const savedHistoricalState = localStorage.getItem(`game_state_${date}`);
      const historicalGameState = savedHistoricalState ? JSON.parse(savedHistoricalState) : {
        guesses: [],
        isComplete: false,
        wordDate: date
      };
      
      setGameState(historicalGameState);
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(historicalGameState));
      
      toast({
        title: "משחק היסטורי נטען",
        description: `המשחק מתאריך ${date} נטען בהצלחה`
      });
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error loading historical game:", error);
      
      const today = new Date().toISOString().split('T')[0];
      const todayState = {
        guesses: [],
        isComplete: false,
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

  const returnToTodayGame = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const savedTodayState = localStorage.getItem(STORAGE_KEY_TODAY_GAME);
    const todayGameStateToUse = savedTodayState ? JSON.parse(savedTodayState) : {
      guesses: [],
      isComplete: false,
      wordDate: today
    };
    
    setGameState(todayGameStateToUse);
    setIsHistoricalGame(false);
    localStorage.removeItem(STORAGE_KEY_HISTORICAL_FLAG);
    
    const todayWordData = dailyWords.find(w => w.date === today && w.is_active);
    if (todayWordData) {
      setTodayWord(todayWordData.word);
    }
    
    toast({
      title: "חזרה למשחק היומי",
      description: "המשחק היומי נטען בהצלחה"
    });
  };

  const fetchLeaderboard = async (date?: string): Promise<void> => {
    const targetDate = date || gameState.wordDate;
    
    try {
      // Use optimized database function for better performance
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
