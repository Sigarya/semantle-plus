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

// In GameBoard.tsx, replace the existing useEffect

useEffect(() => {
  const fetchSampleRanks = async () => {
    console.log("--- DIAGNOSTIC: fetchSampleRanks function has started. ---");

    if (!gameState.wordDate) {
      console.error("DIAGNOSTIC FAILURE: The function is stopping because gameState.wordDate is missing or null. This is a critical problem in the GameContext.");
      setLoadingSampleRanks(false);
      return;
    }
    
    console.log(`Step 1: Game date is valid: ${gameState.wordDate}`);
    
    setLoadingSampleRanks(true);
    setSampleRanks(null);
    
    try {
      console.log("Step 2: Preparing to invoke Supabase function 'get-sample-ranks'.");
      
      const { data, error } = await supabase.functions.invoke("get-sample-ranks", {
        body: { date: gameState.wordDate },
      });

      console.log("Step 3: Supabase function invocation has completed.");

      if (error) {
        // This will catch network errors or if the function itself can't be found.
        console.error("DIAGNOSTIC FAILURE: The .invoke() call returned a direct error.", error);
        throw error;
      }
      
      if (data.error) {
        // This will catch errors from *inside* the Supabase function (like a 500 error).
        console.error("DIAGNOSTIC FAILURE: The function's response body contained an error message.", data.error);
        throw new Error(data.error);
      }
      
      console.log("Step 4: Successfully received data from function:", data);
      setSampleRanks(data.samples);

    } catch (error) {
      console.error("Step 5 (FAILURE): The process failed inside the catch block.", error);
    } finally {
      console.log("Step 6: The 'finally' block has run. Hiding loading spinner.");
      setLoadingSampleRanks(false);
    }
  };
  
  fetchSampleRanks();
}, [gameState.wordDate, supabase]);
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
      setError(errorMessage.includes("not found") ? `אני לא מכיר את המילה ${wordToGuess}` : errorMessage);
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
    // ...
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="text-xl">טוען משחק...</div></div>;
  }
  
  const mostRecentGuess = gameState.guesses[gameState.guesses.length - 1];
  const sortedGuessesForTable = (gameState.isComplete ? gameState.guesses : gameState.guesses.slice(0, -1)).sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="space-y-4 max-w-3xl mx-auto min-h-screen px-4 pt-4 pb-24">
       {/* ... The rest of your JSX is correct and does not need to change ... */}
    </div>
  );
};

export default GameBoard;
