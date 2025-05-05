import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useGame } from "@/context/GameContext";
import { getSimilarityClass, isValidHebrewWord } from "@/lib/utils";
import GuessTable from "./GuessTable";
import { formatHebrewDate } from "@/lib/utils";

const GameBoard = () => {
  const { gameState, todayWord, makeGuess, resetGame, isLoading } = useGame();
  const [guessInput, setGuessInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGameDate = () => {
    if (!gameState.wordDate) return "";
    return formatHebrewDate(new Date(gameState.wordDate));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-semantle-accent">טוען משחק...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center">
        סמנטל עברית יומי - {getGameDate()}
      </h2>
      
      {gameState.isComplete ? (
        <Card className="bg-semantle-dark border-semantle-primary">
          <CardContent className="pt-6 text-center">
            <div className="text-semantle-correct text-2xl font-bold mb-4">
              כל הכבוד! מצאת את המילה!
            </div>
            <div className="text-xl mb-4">
              המילה היא: <span className="font-bold text-semantle-accent">{todayWord}</span>
            </div>
            <div className="text-muted-foreground mb-6">
              מספר ניחושים: {gameState.guesses.length}
            </div>
            <Button 
              onClick={resetGame}
              className="bg-semantle-primary hover:bg-semantle-secondary"
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
              className="guess-input text-lg"
              placeholder="נחש מילה..."
              disabled={isSubmitting}
              dir="rtl"
            />
            <Button
              type="submit"
              className="bg-semantle-primary hover:bg-semantle-secondary px-6"
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
          
          <div className="text-center p-4 bg-semantle-dark rounded-md border border-semantle-primary">
            <p className="text-semantle-accent">
              נחש את המילה היומית! ככל שהניחוש שלך קרוב יותר למילה, כך המדד יהיה גבוה יותר.
            </p>
          </div>
        </form>
      )}

      <GuessTable guesses={gameState.guesses} />
    </div>
  );
};

export default GameBoard;
