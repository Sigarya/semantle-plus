import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress"; 
import { useToast } from "@/components/ui/use-toast";
import { useGame } from "@/context/GameContext";
import { getSimilarityClass, isValidHebrewWord } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const GameBoard = () => {
  const { gameState, todayWord, makeGuess, resetGame, isLoading, isHistoricalGame, returnToTodayGame } = useGame();
  const { currentUser } = useAuth();
  const [guessInput, setGuessInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explorationMode, setExplorationMode] = useState(false);
  const [explorationInput, setExplorationInput] = useState("");
  const [explorationResult, setExplorationResult] = useState<{
    word: string;
    similarity: number;
    rank?: number;
    is_in_top_1000?: boolean;
    rank_in_top_1000?: number | null;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastGuessRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Keep focus on input field and ensure visibility of last guess on mobile
  useEffect(() => {
    if (!isLoading && !gameState.isComplete) {
      inputRef.current?.focus();
      
      // For mobile devices, make sure the last guess is visible
      if (isMobile && lastGuessRef.current && gameState.guesses.length > 0) {
        // Use a short timeout to ensure DOM is updated
        setTimeout(() => {
          lastGuessRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest'
          });
          // Keep the input focused after scrolling
          inputRef.current?.focus();
        }, 100);
      }
    }
  }, [isLoading, gameState.isComplete, gameState.guesses.length, isMobile]);

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guessInput.trim()) return;
    
    // Validate Hebrew word
    if (!isValidHebrewWord(guessInput)) {
      setError("אנא הזן מילה בעברית בלבד");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const result = await makeGuess(guessInput);
      
      if (result.isCorrect) {
        toast({
          title: "כל הכבוד!",
          description: `מצאת את המילה הנכונה: ${result.word}`,
        });
        setExplorationMode(true);
      } else if (result.similarity > 0.7) {
        toast({
          title: "מתקרב!",
          description: `הניחוש שלך קרוב מאוד למילה הנכונה`,
        });
      }
      
      setGuessInput("");
      
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה בניחוש המילה");
      console.error("Guess error:", error);
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "שגיאה בניחוש המילה",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExplorationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!explorationInput.trim()) return;
    
    // Validate Hebrew word
    if (!isValidHebrewWord(explorationInput)) {
      setError("אנא הזן מילה בעברית בלבד");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/calculate-similarity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guess: explorationInput,
          date: gameState.wordDate,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setExplorationResult({
        word: explorationInput,
        similarity: data.similarity,
        rank: data.rank,
        is_in_top_1000: data.is_in_top_1000,
        rank_in_top_1000: data.rank_in_top_1000,
      });
      
      setExplorationInput("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה בבדיקת דמיון");
      console.error("Exploration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to calculate display rank (N/1000)
  const calculateDisplayRank = (rankInTop1000: number | null | undefined): string | null => {
    if (rankInTop1000 === null || rankInTop1000 === undefined) return null;
    
    const displayRank = Math.max(1, 1000 - rankInTop1000);
    return `${displayRank}/1000`;
  };
  
  // Function to calculate progress percentage for the progress bar
  const calculateProgressPercentage = (rankInTop1000: number | null | undefined): number => {
    if (rankInTop1000 === null || rankInTop1000 === undefined) return 0;
    
    const displayRank = Math.max(1, 1000 - rankInTop1000);
    return (displayRank / 1000) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-primary-500 dark:text-primary-400">טוען משחק...</div>
      </div>
    );
  }

  // Find the most recent guess
  const mostRecentGuess = gameState.guesses.length > 0 ? 
    gameState.guesses[gameState.guesses.length - 1] : null;

  // Sort guesses by similarity (highest to lowest)
  const sortedGuesses = [...gameState.guesses].sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center font-heebo">
        סמנטעל +
      </h2>
      
      {gameState.isComplete ? (
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-2xl font-bold mb-4">
              כל הכבוד! מצאת את המילה!
            </div>
            <div className="text-xl mb-4">
              המילה היא: <span className="font-bold text-primary-500 dark:text-primary-400">{todayWord}</span>
            </div>
            <div className="text-muted-foreground mb-6">
              מספר ניחושים: {gameState.guesses.length}
            </div>
            
            <div className="flex flex-col gap-4 items-center">
              {!isHistoricalGame && (
                <Button 
                  onClick={resetGame}
                  className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600"
                >
                  שחק שוב
                </Button>
              )}
              
              <Link to="/history" className="block">
                <Button variant="outline">
                  משחק מיום אחר
                </Button>
              </Link>
              
              {isHistoricalGame && (
                <Button variant="outline" onClick={returnToTodayGame}>
                  חזור למשחק היום
                </Button>
              )}
            </div>
            
            {/* Exploration mode for completed games */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium mb-4">נסה מילים נוספות</h3>
              <p className="text-sm text-muted-foreground mb-4">
                נסה מילים אחרות לראות כמה הן קרובות למילת היום
              </p>
              <form onSubmit={handleExplorationSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={explorationInput}
                    onChange={(e) => setExplorationInput(e.target.value)}
                    className="text-lg"
                    placeholder="נסה מילה..."
                    disabled={isSubmitting}
                    dir="rtl"
                  />
                  <Button
                    type="submit"
                    className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6"
                    disabled={isSubmitting || !explorationInput.trim()}
                  >
                    בדוק
                  </Button>
                </div>
              </form>
              
              {explorationResult && (
                <div className="mt-4 p-3 rounded-md bg-primary-50 dark:bg-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{explorationResult.word}</span>
                    <div className="flex flex-col items-end">
                      <span className={`${getSimilarityClass(explorationResult.similarity)}`}>
                        {(explorationResult.similarity * 100).toFixed(2)}%
                      </span>
                      {explorationResult.is_in_top_1000 && explorationResult.rank_in_top_1000 !== null && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {calculateDisplayRank(explorationResult.rank_in_top_1000)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {explorationResult.is_in_top_1000 && explorationResult.rank_in_top_1000 !== null && (
                    <Progress 
                      value={calculateProgressPercentage(explorationResult.rank_in_top_1000)} 
                      className="h-2 mt-2 bg-gray-200 dark:bg-slate-600"
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleGuessSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              className="text-lg"
              placeholder="נחש מילה..."
              disabled={isSubmitting}
              dir="rtl"
            />
            <Button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6"
              disabled={isSubmitting || !guessInput.trim()}
            >
              נחש
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center p-4 bg-background dark:bg-slate-800 rounded-md border border-primary-200 dark:border-slate-700">
            <p className="text-primary-600 dark:text-primary-400">
              נחש את המילה היומית! ככל שהניחוש שלך קרוב יותר למילה, כך המדד יהיה גבוה יותר.
            </p>
          </div>
        </form>
      )}

      {/* Last Guess - Show the most recent guess */}
      {mostRecentGuess && !gameState.isComplete && (
        <div className="border-b border-primary-200 dark:border-slate-700 pb-4" ref={lastGuessRef}>
          <h3 className="text-lg font-bold font-heebo mb-2">הניחוש האחרון</h3>
          <div className="flex flex-col gap-2 p-3 rounded-md bg-primary-50 dark:bg-slate-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{gameState.guesses.length}</span>
                <span className="font-medium">{mostRecentGuess.word}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`${getSimilarityClass(mostRecentGuess.similarity)}`}>
                  {(mostRecentGuess.similarity * 100).toFixed(2)}%
                </span>
                {mostRecentGuess.is_in_top_1000 && mostRecentGuess.rank_in_top_1000 !== null && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {calculateDisplayRank(mostRecentGuess.rank_in_top_1000)}
                  </span>
                )}
              </div>
            </div>
            
            {mostRecentGuess.is_in_top_1000 && mostRecentGuess.rank_in_top_1000 !== null ? (
              <Progress 
                value={calculateProgressPercentage(mostRecentGuess.rank_in_top_1000)} 
                className="h-2 bg-gray-200 dark:bg-slate-600"
              />
            ) : mostRecentGuess.rank && mostRecentGuess.rank <= 1000 && (
              <Progress 
                value={((1000 - mostRecentGuess.rank + 1) / 1000) * 100} 
                className="h-2 bg-gray-200 dark:bg-slate-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Guesses List - Sorted by similarity (highest to lowest) */}
      {sortedGuesses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-heebo">כל הניחושים</h3>
          <div className="space-y-2">
            {sortedGuesses.map((guess, index) => {
              // Find the original guess index
              const originalIndex = gameState.guesses.findIndex(g => g.word === guess.word && g.similarity === guess.similarity);
              const guessNumber = originalIndex + 1;
              
              return (
                <div 
                  key={`${guess.word}-${guessNumber}`}
                  className={`flex flex-col gap-2 p-3 rounded-md ${
                    guess.isCorrect 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-background dark:bg-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{guessNumber}</span>
                      <span className="font-medium">{guess.word}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`${getSimilarityClass(guess.similarity)}`}>
                        {(guess.similarity * 100).toFixed(2)}%
                      </span>
                      {guess.is_in_top_1000 && guess.rank_in_top_1000 !== null && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {calculateDisplayRank(guess.rank_in_top_1000)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar for top 1000 rankings */}
                  {guess.is_in_top_1000 && guess.rank_in_top_1000 !== null ? (
                    <Progress 
                      value={calculateProgressPercentage(guess.rank_in_top_1000)} 
                      className="h-2 bg-gray-200 dark:bg-slate-600"
                    />
                  ) : guess.rank && guess.rank <= 1000 && (
                    <Progress 
                      value={((1000 - guess.rank + 1) / 1000) * 100} 
                      className="h-2 bg-gray-200 dark:bg-slate-600"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gameState.guesses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          עדיין אין ניחושים. התחל לנחש!
        </div>
      )}
    </div>
  );
};

export default GameBoard;
