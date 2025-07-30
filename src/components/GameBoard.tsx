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
  const [sampleRanks, setSampleRanks] = useState<any>(null);
  const [loadingSampleRanks, setLoadingSampleRanks] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastGuessRef = useRef<HTMLDivElement>(null);

  // Fetch sample ranks (This part is working well)
  useEffect(() => {
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
  }, [gameState.wordDate, supabase]);

  const handleGuessSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guessInput.trim() || isSubmitting) return;

    if (!isValidHebrewWord(guessInput)) {
      setError("אנא הזן מילה בעברית בלבד");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await makeGuess(guessInput);
      setGuessInput(""); // Clear input on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      if (errorMessage.includes("not found") || errorMessage.includes("לא נמצא")) {
        setError(`אני לא מכיר את המילה ${guessInput}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);

      // ===================================================================
      // === THIS IS THE NEW, ROBUST SCROLL AND FOCUS LOGIC ================
      // ===================================================================
      // We use a small timeout to ensure the DOM has updated with the new guess.
      setTimeout(() => {
        if (inputRef.current) {
          const inputElement = inputRef.current;
          
          // 1. Precise Scrolling Calculation
          const inputTopPosition = inputElement.getBoundingClientRect().top;
          const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
          const padding = 5; // The 5 pixels you requested
          const targetScrollY = currentScrollY + inputTopPosition - padding;

          // 2. Perform the Smooth Scroll
          window.scrollTo({
            top: targetScrollY,
            behavior: 'smooth'
          });

          // 3. Restore Focus
          // This happens right after the scroll starts, ensuring a seamless experience.
          inputElement.focus();
        }
      }, 100); // 100ms is a safe delay for the UI to re-render.
      // ===================================================================
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">טוען משחק...</div>;
  }
  
  const mostRecentGuess = gameState.guesses[gameState.guesses.length - 1];
  const sortedGuessesForTable = (gameState.isComplete ? gameState.guesses : gameState.guesses.slice(0, -1)).sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-96">
      <WelcomeDialog />
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heebo">סמנטעל +</h2>
        <div className="text-sm text-muted-foreground mt-2">
          משחק מיום {new Date(gameState.wordDate).toLocaleDateString('he-IL')}
        </div>
      </div>
      
      {gameState.isComplete ? (
        // --- Completion Card (No changes needed here) ---
        <Card>...</Card>
      ) : (
        <>
          {/* --- Sample Ranks Display (No changes needed here) --- */}
          {loadingSampleRanks && <div className="text-center text-sm p-3">טוען פרטי משחק...</div>}
          {sampleRanks && (
             <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-md p-3 mb-4 font-heebo">
               ציון הקרבה של המילה הכי קרובה (999/1000) הוא <strong>{(sampleRanks["999"] * 100).toFixed(2)}</strong>, 
               ציון הקרבה של המילה העשירית הכי קרובה (990/1000) הוא <strong>{(sampleRanks["990"] * 100).toFixed(2)}</strong>, 
               וציון הקרבה של המילה האלף הכי קרובה (1/1000) הוא <strong>{(sampleRanks["1"] * 100).toFixed(2)}</strong>.
             </div>
          )}
          
          {/* =================================================================== */}
          {/* === THIS IS THE NEW, BULLETPROOF INPUT FORM ======================= */}
          {/* =================================================================== */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="נחש מילה..."
                disabled={isSubmitting}
                dir="rtl"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isSubmitting) handleGuessSubmit(e); }}
                
                // --- The "ReadOnly" Trick: The most powerful technique ---
                // It's readonly until you click it, which fools the password manager.
                readOnly 
                onFocus={(e) => e.target.removeAttribute('readOnly')}

                // --- Secondary Layer of Defense ---
                // "new-password" is a well-known trick to tell password managers to back off.
                autoComplete="new-password" 
                
                // --- Standard text input hints ---
                autoCorrect="on"
                spellCheck="true"
                inputMode="text"
                
                // --- Styling (This is the same as your working <Input /> component) ---
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-lg"
              />
              <Button
                type="button" // Important: not "submit"
                onClick={handleGuessSubmit}
                className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6"
                disabled={isSubmitting || !guessInput.trim()}
              >
                נחש
              </Button>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
          {/* =================================================================== */}
        </>
      )}

      {/* --- Guesses Display (No changes needed here) --- */}
      {mostRecentGuess && !gameState.isComplete && <div ref={lastGuessRef}>...</div>}
      {sortedGuessesForTable.length > 0 && <div><GuessTable ... /></div>}
    </div>
  );
};

export default GameBoard;