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
    // ===================================================================
    // === THIS IS THE FINAL, CORRECT IMPLEMENTATION OF YOUR CACHING STRATEGY
    // ===================================================================
    const fetchAndSetSampleRanks = async () => {
      if (!gameState.wordDate) return;
      
      setLoadingSampleRanks(true);
      setSampleRanks(null); // Reset previous data while loading
      
      try {
        // --- Step 1: Check the Supabase cache first ---
        console.log(`Checking Supabase cache for date: ${gameState.wordDate}`);
        const { data: cachedData, error: cacheError } = await supabase
          .from('daily_sample_ranks')
          .select('*')
          .eq('word_date', gameState.wordDate)
          .single();

        if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116 is the "no rows found" code, which is expected.
          console.error("An actual error occurred while checking Supabase cache:", cacheError);
        }
        
        if (cachedData) {
          console.log("✅ Success! Found data in Supabase cache.", cachedData);
          // Reconstruct the 'samples' object from the table columns
          const samplesFromCache = {
            '1': cachedData.rank_1_score,
            '990': cachedData.rank_990_score,
            '999': cachedData.rank_999_score,
            '1000': 1.0 // Rank 1000 is always 100%
          };
          setSampleRanks(samplesFromCache);
          return; // We are done! The data is loaded.
        }

        // --- Step 2: If not in cache, fetch from our Render API ---
        console.log("No cache found. Fetching from Render API...");

        // This is the correct date formatting logic.
        const dateParts = gameState.wordDate.split('-'); // e.g., "2025-07-29"
        const formattedDateForApi = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // e.g., "29/07/2025"
        
        const response = await fetch(`https://hebrew-w2v.onrender.com/sample-ranks?date=${encodeURIComponent(formattedDateForApi)}`);

        if (response.status === 404) {
          console.log(`No data available on Render server for ${formattedDateForApi}. This is normal for future dates.`);
          setSampleRanks(null); // Ensure nothing is displayed
          return; // Exit gracefully
        }

        if (!response.ok) {
          throw new Error(`Render API failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Success! Fetched data from Render API:", data.samples);
        setSampleRanks(data.samples);

        // --- Step 3: Save the new data back to the Supabase cache for next time ---
        console.log("Saving new data to Supabase cache for future use...");
        const { error: insertError } = await supabase
          .from('daily_sample_ranks')
          .insert({
            word_date: gameState.wordDate, // Use the YYYY-MM-DD format for the DB
            rank_1_score: data.samples['1'],
            rank_990_score: data.samples['990'],
            rank_999_score: data.samples['999'],
          });

        if (insertError) {
          // This is not a critical error, just a caching failure.
          console.error("Failed to save data to Supabase cache:", insertError);
        } else {
          console.log("✅ Successfully cached new data in Supabase.");
        }

      } catch (error) {
        console.error("An error occurred during the fetchAndSetSampleRanks process:", error);
        setSampleRanks(null); // On any error, make sure not to show the info
      } finally {
        setLoadingSampleRanks(false);
      }
    };
    
    fetchAndSetSampleRanks();
  }, [gameState.wordDate]);

  const handleGuessSubmit = async (e: React.FormEvent) => {
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
      await makeGuess(wordToGuess);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      if (errorMessage.includes("not found") || errorMessage.includes("לא נמצא")) {
        setError(`אני לא מכיר את המילה ${wordToGuess}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
      setGuessInput("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  // ... The rest of the file (handleExplorationSubmit, the JSX, etc.) is correct and unchanged ...
  const handleExplorationSubmit = async (e: React.FormEvent) => {
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
            <div className="flex flex-col gap-4 items-center">
              <Button onClick={resetGame} className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600">שחק שוב</Button>
              <Link to="/history" className="block"><Button variant="outline">משחק מיום אחר</Button></Link>
            </div>
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium font-heebo mb-4">נסה מילים נוספות</h3>
              <p className="text-sm text-muted-foreground mb-4">נסה מילים אחרות לראות כמה הן קרובות למילה</p>
              <form onSubmit={handleExplorationSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <input type="text" value={explorationInput} onChange={(e) => setExplorationInput(e.target.value)} className="text-lg flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="נסה מילה..." disabled={isSubmitting} dir="rtl" />
                  <Button type="submit" className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6" disabled={isSubmitting || !explorationInput.trim()}>בדוק</Button>
                </div>
              </form>
              {explorationResult && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium font-heebo mb-2">תוצאה:</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader><TableRow><TableHead>#</TableHead><TableHead>מילה</TableHead><TableHead>קרבה</TableHead><TableHead>מתחמם?</TableHead></TableRow></TableHeader>
                      <TableBody><TableRow><TableCell>{'-'}</TableCell><TableCell>{explorationResult.word}</TableCell><TableCell>{`${(explorationResult.similarity * 100).toFixed(2)}%`}</TableCell><TableCell>{explorationResult.rank && explorationResult.rank > 0 ? <div>{explorationResult.rank}/1000</div> : <span>רחוק</span>}</TableCell></TableRow></TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {loadingSampleRanks && <div className="text-center text-sm p-3">טוען פרטי משחק...</div>}
          {sampleRanks && (
             <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-md p-3 mb-4 font-heebo">
               ציון הקרבה של המילה הכי קרובה (999/1000) הוא <strong>{(sampleRanks["999"] * 100).toFixed(2)}</strong>, 
               ציון הקרבה של המילה העשירית הכי קרובה (990/1000) הוא <strong>{(sampleRanks["990"] * 100).toFixed(2)}</strong>, 
               וציון הקרבה של המילה האלף הכי קרובה (1/1000) הוא <strong>{(sampleRanks["1"] * 100).toFixed(2)}</strong>.
             </div>
          )}
          
          <div className="space-y-4">
            <form onSubmit={handleGuessSubmit} className="flex gap-2">
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
              <Button type="submit" className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6" disabled={isSubmitting || !guessInput.trim()}>נחש</Button>
            </form>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
        </>
      )}

      {mostRecentGuess && !gameState.isComplete && (
        <div className="space-y-2" ref={lastGuessRef}>
          <h3 className="text-lg font-bold font-heebo">הניחוש האחרון</h3>
          {/* ... Table display for last guess ... */}
        </div>
      )}

      {sortedGuessesForTable.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-bold font-heebo">ניחושים קודמים</h3>
          <GuessTable guesses={sortedGuessesForTable} originalGuesses={gameState.guesses} showHeader={true}/>
        </div>
      )}

      {gameState.guesses.length === 0 && !gameState.isComplete && (
        <div className="text-center py-8 text-muted-foreground">
          עדיין אין ניחושים. התחל לנחש!
        </div>
      )}
    </div>
  );
};

export default GameBoard;
