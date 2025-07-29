import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useGame } from "@/context/GameContext";
import { getSimilarityClass, isValidHebrewWord } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GuessTable from "@/components/GuessTable";
import WelcomeDialog from "@/components/WelcomeDialog";

const GameBoard = () => {
  const { gameState, currentWord, makeGuess, resetGame, isLoading, isHistoricalGame } = useGame();
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
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastGuessRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Keep focus on input field and ensure input stays visible after guessing
  useEffect(() => {
    if (!isLoading && !gameState.isComplete) {
      inputRef.current?.focus();
      
      // For mobile devices, make sure the input stays visible after making a guess
      if (isMobile && inputRef.current && gameState.guesses.length > 0) {
        // Use a short timeout to ensure DOM is updated
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
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
      // Use the same edge function as the main game
      const { data, error } = await supabase.functions.invoke("calculate-similarity", {
        body: { 
          guess: explorationInput,
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

      setExplorationResult({
        word: explorationInput,
        similarity: data.similarity,
        rank: data.rank,
      });
      
      setExplorationInput("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה בבדיקת דמיון");
      console.error("Exploration error:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      <WelcomeDialog />
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heebo">
          סמנטעל +
        </h2>
        <div className="text-sm text-muted-foreground mt-2">
          משחק מיום {new Date(gameState.wordDate).toLocaleDateString('he-IL')}
        </div>
      </div>
      
      {gameState.isComplete ? (
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-2xl font-bold mb-4">
              כל הכבוד! מצאת את המילה!
            </div>
            <div className="text-xl mb-4">
              המילה היא: <span className="font-bold text-primary-500 dark:text-primary-400">{currentWord}</span>
            </div>
            <div className="text-muted-foreground mb-6">
              מספר ניחושים: {gameState.guesses.length}
            </div>
            
            <div className="flex flex-col gap-4 items-center">
              <Button 
                onClick={resetGame}
                className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600"
              >
                שחק שוב
              </Button>
              
              <Link to="/history" className="block">
                <Button variant="outline">
                  משחק מיום אחר
                </Button>
              </Link>
            </div>
            
            {/* Exploration mode for completed games */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium mb-4">נסה מילים נוספות</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 נסה מילים אחרות לראות כמה הן קרובות למילה
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
                    <span className={`${getSimilarityClass(explorationResult.similarity)}`}>
                      {(explorationResult.similarity * 100).toFixed(2)}%
                    </span>
                  </div>
                  
                   {explorationResult.rank && explorationResult.rank <= 1000 && (
                     <Progress 
                       value={(explorationResult.rank / 1000) * 100} 
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              inputMode="text"
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
          
        </form>
      )}

      {/* Last Guess Display (styled like table but highlighted) */}
      {mostRecentGuess && !gameState.isComplete && (
        <div className="space-y-4" ref={lastGuessRef}>
          <h3 className="text-lg font-bold font-heebo">הניחוש האחרון</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="text-right w-12 py-2 px-2">#</TableHead>
                  <TableHead className="text-right py-2 px-2">מילה</TableHead>
                  <TableHead className="text-center w-20 py-2 px-2">קרבה</TableHead>
                  <TableHead className="text-center w-28 py-2 px-2">מתחמם?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-primary-100 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700">
                  <TableCell className="py-1 px-2 text-xs font-medium text-primary-700 dark:text-primary-300">
                    {gameState.guesses.length}
                  </TableCell>
                  <TableCell className="font-medium py-1 px-2 text-xs truncate text-primary-700 dark:text-primary-300">
                    {mostRecentGuess.word}
                  </TableCell>
                  <TableCell className="text-center py-1 px-2 text-xs text-primary-700 dark:text-primary-300">
                    {`${(mostRecentGuess.similarity * 100).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="text-center py-1 px-2">
                    {mostRecentGuess.rank && mostRecentGuess.rank > 0 ? (
                      <div className="flex items-center gap-1 justify-center">
                        <div 
                          className="h-3 bg-green-500 rounded-sm flex-shrink-0" 
                          style={{ width: `${Math.min(mostRecentGuess.rank / 10, 100)}px` }}
                        />
                        <span className="text-xs text-primary-700 dark:text-primary-300 font-heebo whitespace-nowrap">
                          {mostRecentGuess.rank}/1000
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-primary-700 dark:text-primary-300 font-heebo">רחוק</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Guesses Table (excluding the most recent guess when game is not complete, sorted by similarity) */}
      {sortedGuesses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-heebo">
            {gameState.isComplete ? "ניחושים" : "ניחושים קודמים"}
          </h3>
          <GuessTable 
            guesses={gameState.isComplete ? sortedGuesses : (sortedGuesses.length > 1 ? sortedGuesses.slice(0, -1) : [])} 
          />
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
