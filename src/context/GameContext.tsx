import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Guess, GameState, DailyWord } from "../types/game";
import { calculateSimilarity, getTodayWord } from "../lib/utils";
import { useAuth } from "./AuthContext";

interface GameContextType {
  gameState: GameState;
  isLoading: boolean;
  todayWord: string | null;
  makeGuess: (word: string) => Promise<Guess>;
  resetGame: () => void;
  dailyWords: DailyWord[];
  setWordForDate: (word: string, date: string) => void;
  loadHistoricalGame: (date: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Mock daily words for demo
const initialDailyWords: DailyWord[] = [
  { word: "מחשב", date: "2025-05-04", hints: ["אלקטרוני", "מקלדת"] },
  { word: "בית", date: "2025-05-05", hints: ["מגורים", "משפחה"] },
  { word: "ספר", date: "2025-05-06", hints: ["קריאה", "סיפור"] },
];

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    isComplete: false,
    wordDate: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todayWord, setTodayWord] = useState<string | null>(null);
  const [dailyWords, setDailyWords] = useState<DailyWord[]>(initialDailyWords);

  // Load or initialize game on mount
  useEffect(() => {
    const loadGame = async () => {
      setIsLoading(true);
      
      // Try to load saved game state
      const savedState = localStorage.getItem("semantle_game_state");
      const savedStateObj = savedState ? JSON.parse(savedState) : null;
      
      // Get today's word
      const word = await getTodayWord();
      setTodayWord(word);
      
      const today = new Date().toISOString().split('T')[0];
      
      // If we have a saved state and it's from today, use it
      if (savedStateObj && savedStateObj.wordDate === today) {
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

    loadGame();
  }, []);

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

    const similarity = await calculateSimilarity(word, todayWord);
    const isCorrect = word === todayWord;
    
    // Calculate rank (in real implementation this would come from backend)
    let rank;
    if (similarity > 0.3) {
      rank = Math.floor((1 - similarity) * 1000) + 1;
    }

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
      // In a real app, this would call an API to update user stats
      console.log(`User ${currentUser.username} won the game in ${newGuesses.length} guesses!`);
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

  const setWordForDate = (word: string, date: string) => {
    // This would typically update a database in a real app
    // Check if we already have a word for this date
    const existingWordIndex = dailyWords.findIndex(dw => dw.date === date);
    
    if (existingWordIndex >= 0) {
      // Update existing word
      const updatedWords = [...dailyWords];
      updatedWords[existingWordIndex] = {
        ...updatedWords[existingWordIndex],
        word
      };
      setDailyWords(updatedWords);
    } else {
      // Add new word
      setDailyWords([...dailyWords, { word, date }]);
    }
    
    // If this is today's word, update it
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      setTodayWord(word);
    }
  };

  const loadHistoricalGame = (date: string) => {
    // Find the word for the given date
    const wordForDate = dailyWords.find(dw => dw.date === date);
    
    if (!wordForDate) {
      throw new Error("לא נמצאה מילה לתאריך זה");
    }
    
    // Set the game state to a new game with the historical date
    setTodayWord(wordForDate.word);
    setGameState({
      guesses: [],
      isComplete: false,
      wordDate: date
    });
  };

  return (
    <GameContext.Provider 
      value={{ 
        gameState, 
        isLoading, 
        todayWord, 
        makeGuess, 
        resetGame,
        dailyWords,
        setWordForDate,
        loadHistoricalGame
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
