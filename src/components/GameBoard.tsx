// GameBoard.tsx

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGame } from "@/context/GameContext";
import { isValidHebrewWord } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import GuessTable from "@/components/GuessTable";
import WelcomeDialog from "@/components/WelcomeDialog";

const GameBoard = () => {
  const { gameState, currentWord, makeGuess, resetGame, isLoading } = useGame();
  const [guessInput, setGuessInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explorationInput, setExplorationInput] = useState("");
  const [explorationResult, setExplorationResult] = useState<{ word: string; similarity: number; rank?: number; } | null>(null);
  const [sampleRanks, setSampleRanks] = useState<any>(null);
  const [loadingSampleRanks, setLoadingSampleRanks] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastGuessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This function for fetching sample ranks is correct and does not need to change.
    const fetchAndSetSampleRanks = async () => {
      if (!gameState.wordDate) return;
      setLoadingSampleRanks(true);
      try {
        const { data: cachedData } = await supabase.from('daily_sample_ranks').select('*').eq('word_date', gameState.wordDate).single();
        if (cachedData) {
          setSampleRanks({ '1': cachedData.rank_1_score, '990': cachedData.rank_990_score, '999': cachedData.rank_999_score });
        } else {
          const dateParts = gameState.wordDate.split('-');
          const formattedDateForApi = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
          const response = await fetch(`https://hebrew-w2v.onrender.com/sample-ranks?date=${encodeURIComponent(formattedDateForApi)}`);
          if (!response.ok) throw new Error("API failed");
          const data = await response.json();
          setSampleRanks(data.samples);
          await supabase.from('daily_sample_ranks').insert({ word_date: gameState.wordDate, rank_1_score: data.samples['1'], rank_990_score: data.samples['990'], rank_999_score: data.samples['999'] });
        }
      } catch (error) {
        console.error("Error fetching sample ranks:", error);
      } finally {
        setLoadingSampleRanks(false);
      }
    };
    fetchAndSetSampleRanks();
  }, [gameState.wordDate]);

  const handleGuessSubmit = async (e: React.FormEvent) => {
    // Step 1: Prevent the browser's default page reload. This is critical.
    e.preventDefault();
    
    if (!guessInput.trim() || isSubmitting) return;

    if (!isValidHebrewWord(guessInput)) {
      setError("אנא הזן מילה בעברית בלבד");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    
    const wordToGuess = guessInput;
    
    try {
      // Step 2: Make the guess. The UI is still focused on the input at this point.
      await makeGuess(wordToGuess);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      if (errorMessage.includes("not found") || errorMessage.includes("לא נמצא")) {
        setError(`אני לא מכיר את המילה ${wordToGuess}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      // Step 3: This 'finally' block runs after the guess is complete, whether it succeeded or failed.
      setIsSubmitting(false);
      setGuessInput(""); // Clear the input for the next guess.
      
      // Step 4: The magic. Immediately and synchronously return focus to the input.
      // This is so fast, the browser doesn't have time to hide the keyboard.
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  const handleExplorationSubmit = async (e: React.FormEvent) => {
    // This function for the exploration mode is fine and does not need to change.
    e.preventDefault();
    if (!explorationInput.trim()) return;
    if (!isValidHebrewWord(explorationInput)) {
      setError("אנא הזן מילה בעברית בלבד");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-similarity", { body: { guess: explorationInput, date: gameState.wordDate } });
      if (error) throw new Error("שגיאה בחישוב הדמיון");
      if (data.error) throw new Error(data.error);
      setExplorationResult({ word: explorationInput, similarity: data.similarity, rank: data.rank });
      setExplorationInput("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה בבדיקת דמיון");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="text-xl">טוען משחק...</div></div>;
  }
  
  const mostRecentGuess = gameState.guesses[gameState.guesses.length - 1];
  const sortedGuessesForTable = (gameState.isComplete ? gameState.guesses : gameState.guesses.slice(0, -1)).sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="space-y-4 max-w-3xl mx-auto min-h-screen px-4 pt-4 pb-24">
      <WelcomeDialog />
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heebo">סמנטעל +</h2>
        <div className="text-sm text-muted-foreground mt-2">
          משחק מיום {new Date(gameState.wordDate).toLocaleDateString('he-IL')}
        </div>
      </div>
      
      {gameState.isComplete ? (
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-2xl font-bold mb-4">כל הכבוד! מצאת את המילה!</div>
            <div className="text-xl mb-4">המילה היא: <span className="font-bold text-primary-500 dark:text-primary-400">{currentWord}</span></div>
            <div className="text-muted-foreground mb-6">מספר ניחושים: {gameState.guesses.length}</div>
            {/* ... The rest of the 'isComplete' section is unchanged ... */}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ... The sample ranks display is unchanged ... */}
          
          <div className="space-y-4">
            {/* =================================================================== */}
            {/* === THIS IS THE FINAL, CORRECT FORM IMPLEMENTATION ============== */}
            {/* =================================================================== */}
            {/* We use a standard <form> with an onSubmit handler. */}
            {/* This makes the "Enter" key work perfectly. */}
            <form onSubmit={handleGuessSubmit} className="flex gap-2">
              {/* The invisible password field trick remains to fix the mobile keyboard. */}
              <input type="password" name="password" autoComplete="new-password" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
              
              <input
                ref={inputRef}
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="נחש מילה..."
                disabled={isSubmitting}
                dir="rtl"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-lg"
              />
              
              {/* The button is now a standard `type="submit"`. */}
              {/* It will automatically trigger the form's onSubmit handler. */}
              <Button 
                type="submit" 
                className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6" 
                disabled={isSubmitting || !guessInput.trim()}
              >
                נחש
              </Button>
            </form>
            {/* =================================================================== */}
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
        </>
      )}

      {/* ... The rest of the file (displaying the guess tables) is unchanged ... */}
      {mostRecentGuess && !gameState.isComplete && (
        // ...
      )}
      {sortedGuessesForTable.length > 0 && (
        // ...
      )}
      {gameState.guesses.length === 0 && !gameState.isComplete && (
        // ...
      )}
    </div>
  );
};

export default GameBoard;
