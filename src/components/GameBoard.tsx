// GameBoard.tsx

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGame } from "@/context/GameContext";
import { isValidHebrewWord, validateHebrewWord } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import GuessTable from "@/components/GuessTable";
import WelcomeDialog from "@/components/WelcomeDialog";

// Utility function for progress bar width calculation
const getProgressBarWidth = (rank: number): string => {
  if (!rank || rank <= 0) return '0%';
  const percentage = Math.min((rank / 1000) * 100, 100);
  return `${percentage}%`;
};

const GameBoard = React.memo(() => {
  const { gameState, currentWord, makeGuess, resetGame, isLoading } = useGame();
  const [guessInput, setGuessInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const [explorationInput, setExplorationInput] = useState("");
  const [explorationResult, setExplorationResult] = useState<{ word: string; similarity: number; rank?: number } | null>(null);
  const [sampleRanks, setSampleRanks] = useState<{ '1': number; '990': number; '999': number } | null>(null);
  const [loadingSampleRanks, setLoadingSampleRanks] = useState(false);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const timeoutMessageRef = useRef<NodeJS.Timeout | null>(null);
  
  // Flash effect for duplicate guesses
  const [flashingWord, setFlashingWord] = useState<string | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Intelligent focus management
  const [shouldRefocus, setShouldRefocus] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const lastGuessRef = useRef<HTMLDivElement>(null);

  const fetchAndSetSampleRanks = useCallback(async () => {
    if (!gameState.wordDate) return;
    setLoadingSampleRanks(true);
    try {
      const { data: cachedData, error: fetchError } = await supabase
        .from('daily_sample_ranks')
        .select('*')
        .eq('word_date', gameState.wordDate)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('שגיאה בטעינת נתונים מהמאגר');
      }
      
      if (cachedData) {
        setSampleRanks({ 
          '1': cachedData.rank_1_score, 
          '990': cachedData.rank_990_score, 
          '999': cachedData.rank_999_score 
        });
      } else {
        const dateParts = gameState.wordDate.split('-');
        if (dateParts.length !== 3) {
          throw new Error('פורמט תאריך לא תקין');
        }
        
        const formattedDateForApi = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        const response = await fetch(`https://combined-he-w2v-api.onrender.com/sample-ranks?date=${encodeURIComponent(formattedDateForApi)}`);
        
        if (!response.ok) {
          throw new Error(`שגיאה בקבלת נתונים מהשרת: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.samples || typeof data.samples !== 'object') {
          throw new Error('פורמט תגובה לא תקין מהשרת');
        }
        
        setSampleRanks(data.samples);
        
        // Try to cache the result, but don't fail if it doesn't work
        try {
          await supabase.from('daily_sample_ranks').insert({ 
            word_date: gameState.wordDate, 
            rank_1_score: data.samples['1'], 
            rank_990_score: data.samples['990'], 
            rank_999_score: data.samples['999'] 
          });
        } catch (insertError) {
          console.warn('לא ניתן לשמור במאגר:', insertError);
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתוני דירוג:', error);
    } finally {
      setLoadingSampleRanks(false);
    }
  }, [gameState.wordDate]);
  
  useEffect(() => {
    fetchAndSetSampleRanks();
  }, [fetchAndSetSampleRanks]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      if (timeoutMessageRef.current) {
        clearTimeout(timeoutMessageRef.current);
      }
    };
  }, []);

  // Intelligent focus management - only refocus after guess submission
  useEffect(() => {
    if (shouldRefocus && !gameState.isComplete && inputRef.current) {
      inputRef.current.focus();
      setShouldRefocus(false); // Consume the refocus request
    }
  }, [shouldRefocus, gameState.isComplete]);



  const handleGuessSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!guessInput.trim() || isSubmitting) return;

    // Sanitize input by removing geresh characters (') before validation
    const sanitizedInput = guessInput.replace(/'/g, '');

    // Enhanced validation with specific error messages
    const validation = validateHebrewWord(sanitizedInput);
    if (!validation.isValid) {
      setError(validation.errorMessage || "שגיאה בבדיקת המילה");
      return;
    }

    // Clear error and capture the sanitized word immediately
    setError(null);
    const wordToGuess = sanitizedInput.trim();
    
    // Check if word was already guessed - if so, flash the duplicate and show it in Last Guess panel
    const existingGuess = gameState.guesses.find(g => g.word === wordToGuess);
    if (existingGuess) {
      // Clear input immediately
      setGuessInput("");
      
      // Flash the duplicate word in the main guess table
      setFlashingWord(wordToGuess);
      
      // Clear any existing flash timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      
      // Stop flashing after 2 seconds
      flashTimeoutRef.current = setTimeout(() => {
        setFlashingWord(null);
      }, 2000);
      
      // Trigger refocus after duplicate guess submission
      setShouldRefocus(true);
      
      return;
    }
    
    // CRITICAL: Clear input IMMEDIATELY and set submission state
    setGuessInput("");
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    // Start timeout message timer
    timeoutMessageRef.current = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 8000);
    
      try {
      await makeGuess(wordToGuess);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      
      // Check for vocabulary errors (word not found in the vocabulary)
      if (errorMessage.includes("not found") || 
          errorMessage.includes("לא נמצא") ||
          errorMessage.includes("Word not found in vocabulary") ||
          errorMessage.includes("לא נמצאה במאגר")) {
        setError(`אני לא מכיר את המילה ${wordToGuess}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      // Clear timeout message and timer
      if (timeoutMessageRef.current) {
        clearTimeout(timeoutMessageRef.current);
        timeoutMessageRef.current = null;
      }
      setShowTimeoutMessage(false);
      
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      
      // Trigger intelligent refocus after guess submission
      setShouldRefocus(true);
    }
  };
  
  const handleExplorationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explorationInput.trim()) return;
    
    // Sanitize input by removing geresh characters (') before validation
    const sanitizedExplorationInput = explorationInput.replace(/'/g, '');
    
    // Enhanced validation with specific error messages
    const validation = validateHebrewWord(sanitizedExplorationInput);
    if (!validation.isValid) {
      setError(validation.errorMessage || "שגיאה בבדיקת המילה");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-similarity", { body: { guess: sanitizedExplorationInput, date: gameState.wordDate } });
      if (error) throw new Error("שגיאה בחישוב הדמיון");
      if (data.error) {
        // Check if it's a "word not found" error
        if (data.error.includes("Word not found in vocabulary") ||
            data.error.includes("not found") ||
            data.error.includes("לא נמצא") ||
            data.error.includes("לא נמצאה במאגר")) {
          throw new Error(`אני לא מכיר את המילה ${sanitizedExplorationInput}`);
        } else {
          throw new Error(data.error);
        }
      }
      setExplorationResult({ word: sanitizedExplorationInput, similarity: data.similarity, rank: data.rank });
      setExplorationInput("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בבדיקת דמיון";
      // Check if it's a "word not found" error that wasn't caught above
      if (errorMessage.includes("Word not found in vocabulary") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("לא נמצא") ||
          errorMessage.includes("לא נמצאה במאגר")) {
        setError(`אני לא מכיר את המילה ${sanitizedExplorationInput}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoize the formatted date to avoid recalculation on every render
  const formattedGameDate = useMemo(() => 
    new Date(gameState.wordDate).toLocaleDateString('he-IL'), 
    [gameState.wordDate]
  );

  // Auto-focus input when component mounts and keep it focused
  useEffect(() => {
    if (!isLoading && !gameState.isComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, gameState.isComplete]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="text-xl">טוען משחק...</div></div>;
  }
  
  // Show most recent guess, or the flashing duplicate if one is active
  const flashingGuess = flashingWord ? gameState.guesses.find(g => g.word === flashingWord) : null;
  const mostRecentGuess = flashingGuess || gameState.guesses[gameState.guesses.length - 1];
  const displayedGuessNumber = flashingGuess 
    ? gameState.guesses.findIndex(g => g.word === flashingWord) + 1
    : gameState.guesses.length;
  
  const sortedGuessesForTable = (gameState.isComplete ? gameState.guesses : gameState.guesses.slice(0, -1)).sort((a, b) => b.similarity - a.similarity);

  return (
    <div 
      className="space-y-4 max-w-3xl mx-auto min-h-screen px-2 sm:px-4 pt-4 pb-20 sm:pb-24"
      style={{
        // Prevent scroll during submission for stable view
        overflowAnchor: 'none'
      }}
    >
      <WelcomeDialog />
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heebo">סמנטעל +</h2>
        <div className="text-sm text-muted-foreground mt-2">
          משחק מיום {formattedGameDate}
        </div>
      </div>
      
      {gameState.isComplete ? (
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-2xl font-bold mb-4">כל הכבוד! מצאת את המילה!</div>
            <div className="text-xl mb-4">המילה היא: <span className="font-bold text-primary-500 dark:text-primary-400">{currentWord}</span></div>
            <div className="text-muted-foreground mb-6">מספר ניחושים: {gameState.guesses.length}</div>
                          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Button onClick={resetGame} className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 w-full sm:w-auto">שחק שוב</Button>
                <Link to="/history" className="block w-full sm:w-auto"><Button variant="outline" className="w-full sm:w-auto">משחק מיום אחר</Button></Link>
              </div>
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium font-heebo mb-4">נסה מילים נוספות</h3>
              <p className="text-sm text-muted-foreground mb-4">נסה מילים אחרות לראות כמה הן קרובות למילה</p>
              <form onSubmit={handleExplorationSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={explorationInput} onChange={(e) => setExplorationInput(e.target.value)} className="text-lg flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="נסה מילה..." disabled={isSubmitting} dir="rtl" />
                  <Button type="submit" className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-6 w-full sm:w-auto" disabled={isSubmitting || !explorationInput.trim()}>בדוק</Button>
                </div>
              </form>
              {explorationResult && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium font-heebo mb-2">תוצאה:</h4>
                  <div className="border rounded-md overflow-x-auto">
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
            {/* Timeout message with fade animation */}
            {showTimeoutMessage && (
              <div className="animate-in fade-in duration-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    לא נתקענו, פשוט לוקח לנו קצת זמן לחשב את הניחוש הראשון לפעמים :)<br/>
                    אל דאגה, מהניחוש הבא הכול יזרום הרבה יותר מהר
                  </div>
                </div>
              </div>
            )}
            
            <form 
              onSubmit={handleGuessSubmit} 
              className="flex flex-row gap-2" 
              autoComplete="off"
              style={{
                // Prevent form from shifting during submission
                minHeight: '50px'
              }}
            >
              <input
                ref={inputRef}
                type="search"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="נחש מילה..."
                disabled={false}
                dir="rtl"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="none"
                inputMode="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-lg"
              />
              <Button 
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600 px-4 py-2 text-sm font-medium whitespace-nowrap flex items-center justify-center min-w-[70px] h-10" 
                disabled={!guessInput.trim()}
                onMouseDown={(e) => {
                  // Prevent button from stealing focus from input
                  e.preventDefault();
                }}
                onTouchStart={(e) => {
                  // Prevent button from stealing focus on mobile
                  e.preventDefault();
                }}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "נחש"
                )}
              </Button>
            </form>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
        </>
      )}

      {(mostRecentGuess && !gameState.isComplete) && (
        <div className="space-y-2" ref={lastGuessRef}>
          <h3 className="text-lg font-bold font-heebo">
            {flashingWord ? "ניחוש קודם" : "הניחוש האחרון"}
          </h3>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b"><TableHead className="text-right w-12 py-2 px-2">#</TableHead><TableHead className="text-right w-24 py-2 px-2">מילה</TableHead><TableHead className="text-center w-20 py-2 px-2">קרבה</TableHead><TableHead className="text-center w-28 py-2 px-2">מתחמם?</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-primary-100 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700">
                  <TableCell className="w-12 py-1 px-2 text-xs font-medium text-primary-700 dark:text-primary-300">
                    {displayedGuessNumber}
                  </TableCell>
                  <TableCell className="w-24 font-medium py-1 px-2 text-xs truncate text-primary-700 dark:text-primary-300">
                    {mostRecentGuess.word}
                  </TableCell>
                  <TableCell className="w-20 text-center py-1 px-2 text-xs text-primary-700 dark:text-primary-300">
                    {`${(mostRecentGuess.similarity * 100).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="w-28 text-center py-1 px-2">
                    {mostRecentGuess.rank && mostRecentGuess.rank > 0 ? (
                      <div className="flex items-center gap-1 justify-center">
                        <div className="relative w-16 h-3 bg-muted rounded-sm flex-shrink-0">
                          <div 
                            className="absolute top-0 left-0 h-full bg-green-500 rounded-sm min-w-[2px]" 
                            style={{ width: getProgressBarWidth(mostRecentGuess.rank) }}
                          />
                        </div>
                        <span className="text-xs text-primary-700 dark:text-primary-300 font-heebo whitespace-nowrap">
                          {mostRecentGuess.rank}/1000
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-primary-700 dark:text-primary-300 font-heebo">
                        רחוק
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {sortedGuessesForTable.length > 0 && (
        <div className={mostRecentGuess && !gameState.isComplete ? "mt-1" : "space-y-2"}>
          <GuessTable guesses={sortedGuessesForTable} originalGuesses={gameState.guesses} showHeader={!mostRecentGuess || gameState.isComplete} flashingWord={flashingWord}/>
        </div>
      )}

      {gameState.guesses.length === 0 && !gameState.isComplete && (
        <div className="text-center py-8 text-muted-foreground">
          עדיין אין ניחושים. התחל לנחש!
        </div>
      )}
    </div>
  );
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;
