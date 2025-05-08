
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

const GameBoard = () => {
  const { gameState, todayWord, makeGuess, resetGame, isLoading } = useGame();
  const { currentUser } = useAuth();
  const [guessInput, setGuessInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastGuess, setLastGuess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Keep focus on input field
  useEffect(() => {
    if (!isLoading && !gameState.isComplete) {
      inputRef.current?.focus();
    }
  }, [isLoading, gameState.isComplete]);

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
      setLastGuess(guessInput);
      
      if (result.isCorrect) {
        toast({
          title: "כל הכבוד!",
          description: `מצאת את המילה הנכונה: ${result.word}`,
        });
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
      
      // Add a toast for API errors for better visibility
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "שגיאה בניחוש המילה",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate display rank out of 1000
  const getDisplayRank = (rank?: number) => {
    if (!rank || rank > 1000) return null;
    return `${1000 - rank + 1}/1000`;
  };

  // Calculate progress percentage for the progress bar
  const getProgressValue = (rank?: number) => {
    if (!rank || rank > 1000) return 0;
    return ((1000 - rank + 1) / 1000) * 100; // Convert to percentage
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
            <Button 
              onClick={resetGame}
              className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600"
            >
              שחק שוב
            </Button>
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

      {/* Last Guess - Updated to show the most recent guess */}
      {mostRecentGuess && !gameState.isComplete && (
        <div className="border-b border-primary-200 dark:border-slate-700 pb-4">
          <h3 className="text-lg font-bold font-heebo mb-2">הניחוש האחרון</h3>
          <div className="flex flex-col gap-2 p-3 rounded-md bg-primary-50 dark:bg-slate-700">
            <div className="flex justify-between items-center">
              <span className="font-medium">{mostRecentGuess.word}</span>
              <div className="flex items-center gap-2">
                <span className={`${getSimilarityClass(mostRecentGuess.similarity)}`}>
                  {(mostRecentGuess.similarity * 100).toFixed(2)}%
                </span>
                {getDisplayRank(mostRecentGuess.rank) && (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {getDisplayRank(mostRecentGuess.rank)}
                  </span>
                )}
              </div>
            </div>
            
            {mostRecentGuess.rank && mostRecentGuess.rank <= 1000 && (
              <Progress 
                value={getProgressValue(mostRecentGuess.rank)} 
                className="h-2 bg-gray-200 dark:bg-slate-600"
              />
            )}
          </div>
        </div>
      )}

      {/* Guesses List - No scrollable container as requested */}
      {gameState.guesses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-heebo">כל הניחושים</h3>
          <div className="space-y-2">
            {gameState.guesses.map((guess, index) => (
              <div 
                key={index}
                className={`flex flex-col gap-2 p-3 rounded-md ${
                  guess.isCorrect 
                    ? "bg-green-100 dark:bg-green-900/30" 
                    : "bg-background dark:bg-slate-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{gameState.guesses.length - index}</span>
                    <span className="font-medium">{guess.word}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`${getSimilarityClass(guess.similarity)}`}>
                      {(guess.similarity * 100).toFixed(2)}%
                    </span>
                    {getDisplayRank(guess.rank) ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {getDisplayRank(guess.rank)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {guess.rank ? `דירוג: ${guess.rank}` : "-"}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Progress bar for top 1000 rankings */}
                {guess.rank && guess.rank <= 1000 && (
                  <Progress 
                    value={getProgressValue(guess.rank)} 
                    className="h-2 bg-gray-200 dark:bg-slate-600"
                  />
                )}
              </div>
            ))}
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
