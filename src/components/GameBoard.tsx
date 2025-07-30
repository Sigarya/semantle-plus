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

  const handleGuessSubmit = (e: React.FormEvent) => {
    // This function is now synchronous from the browser's perspective.
    e.preventDefault();
    
    if (!guessInput.trim() || isSubmitting) return;

    if (!isValidHebrewWord(guessInput)) {
      setError("אנא הזן מילה בעברית בלבד");
      return;
    }

    setError(null);
    
    // We call makeGuess but DO NOT `await` it.
    // This "fires and forgets" the async task, allowing this function to complete instantly.
    makeGuess(guessInput).catch((err) => {
      // We still handle errors if the promise rejects.
      const errorMessage = err instanceof Error ? err.message : "שגיאה בניחוש המילה";
      if (errorMessage.includes("not found") || errorMessage.includes("לא נמצא")) {
        setError(`אני לא מכיר את המילה ${guessInput}`);
      } else {
        setError(errorMessage);
      }
    });

    // Because the function finishes immediately, the input never loses focus.
    // The keyboard never disappears.
    setGuessInput("");
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
            {/* ... The completion card is unchanged ... */}
        </Card>
      ) : (
        <>
          {/* ... The sample ranks display is unchanged ... */}
          
          <div className="space-y-4">
            {/* The form structure is correct and unchanged */}
            <form onSubmit={handleGuessSubmit} className="flex gap-2">
              <input type="password" name="password" autoComplete="new-password" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
              <input
                ref={inputRef}
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="נחש מילה..."
                disabled={gameState.isSubmitting} // We now use the global isSubmitting state
                dir="rtl"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-lg"
              />
              <Button type="submit" className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6" disabled={gameState.isSubmitting || !guessInput.trim()}>נחש</Button>
            </form>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
        </>
      )}

      {/* The rest of the file (displaying the guess tables) is unchanged and correct */}
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
