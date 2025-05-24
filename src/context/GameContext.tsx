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
          gameStateToLoad = savedTodayState ? JSON.parse(savedTodayState) : {
            guesses: [],
            isComplete: false,
            wordDate: today
          };
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
    }
  }, [gameState, isLoading, isHistoricalGame, todayWord]);

  const makeGuess = async (word: string): Promise<Guess> => {
    if (!todayWord) throw new Error("המשחק לא נטען כראוי");
    if (gameState.isComplete) throw new Error("המשחק הסתיים");
    
    // Check if word was already guessed
    if (gameState.guesses.some(g => g.word === word)) {
      throw new Error("כבר ניחשת את המילה הזאת");
    }

    // Call our edge function to calculate similarity
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
