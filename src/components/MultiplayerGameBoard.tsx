import React, { useState, useCallback, useMemo, useRef } from "react";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import GuessTable, { DisplayGuess } from "@/components/GuessTable";
import { Loader2, Users, Trophy, Target, Copy, Check } from "lucide-react";

const MultiplayerGameBoard = () => {
  const { gameState, makeGuess, leaveRoom } = useMultiplayer();
  const { toast } = useToast();
  const [guessInput, setGuessInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Memoize sorted guesses and derive the last guess and the rest of the guesses
  const sortedGuesses = useMemo(() => {
    return [...gameState.guesses].sort((a, b) => b.similarity - a.similarity);
  }, [gameState.guesses]);
  
  const mostRecentGuess = useMemo(() => {
    if (gameState.guesses.length === 0) return null;
    // Find the guess with the highest guess_order, which indicates it's the latest
    return gameState.guesses.reduce((latest, current) => latest.guess_order > current.guess_order ? latest : current);
  }, [gameState.guesses]);
  
  const sortedGuessesForTable = useMemo(() => {
    // If the game is complete, show all guesses in the main table
    if (gameState.isComplete) {
      return sortedGuesses;
    }
    // Otherwise, show all guesses *except* the most recent one, which has its own panel
    return sortedGuesses.filter(g => g.id !== mostRecentGuess?.id);
  }, [sortedGuesses, mostRecentGuess, gameState.isComplete]);


   const copyRoomCode = useCallback(async () => {
    const code = gameState.room?.room_code || '';
    if (!code) return;

    try {
      // Modern, secure way to copy
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for older browsers or insecure contexts (like http://)
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px'; // Move it off-screen
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
      // If all else fails, show the user the code to copy manually
      window.prompt('Could not copy automatically. Please copy this code:', code);
    }
  }, [gameState.room?.room_code]);

  const handleGuessSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await makeGuess(guessInput.trim());
      setGuessInput("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      toast({ title: "שגיאה", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [guessInput, isSubmitting, makeGuess, toast]);

  if (!gameState.room) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען משחק מרובה משתתפים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="multiplayer-board max-w-3xl mx-auto space-y-4">

      {gameState.isComplete && (
        <Card className="border-green-400 bg-green-50 text-green-800 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <Trophy className="h-10 w-10 text-green-500" />
              <div>
                <CardTitle className="text-2xl font-bold">ניצחתם!</CardTitle>
                <p className="mt-2 text-green-700">מצאתם את המילה הסודית ביחד, כל הכבוד!</p>
              </div>
              <Button onClick={leaveRoom} variant="outline" className="mt-2 border-green-300 hover:bg-green-100 text-green-800">
                עזוב חדר
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2"><Users className="h-5 w-5" /> חדר מרובה משתתפים</CardTitle>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
            <span>שחקנים: {gameState.players.length}</span>
            <span>תאריך: {new Date(gameState.room.word_date).toLocaleDateString('he-IL')}</span>
            <span className="flex items-center">
              קוד: 
              <button onClick={copyRoomCode} className="inline-flex items-center gap-1 mr-1 hover:bg-muted px-2 py-0.5 rounded transition-colors" title="לחץ להעתקה">
                <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/20">{gameState.room.room_code}</Badge>
                {copiedCode ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </span>
          </div>
        </CardHeader>
      </Card>
      
      {!gameState.isComplete && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> כאן מנחשים:</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleGuessSubmit} className="guess-form flex gap-2">
              <Input ref={inputRef} aria-label="המילה לניחוש" value={guessInput} onChange={(e) => setGuessInput(e.target.value)} placeholder="הקלד מילה..." className="flex-1" dir="rtl"/>
              <Button type="submit" onMouseDown={event => event.preventDefault()} disabled={isSubmitting || !guessInput.trim()} className="min-w-[80px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "נחש"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {gameState.guesses.length > 0 && <div className="guess-results">
        <h3 className="sr-only">{gameState.isComplete ? `כל הניחושים (${sortedGuesses.length})` : "ניחושים קודמים"}</h3>
        <span className="sr-only" role="status" aria-live="polite">{mostRecentGuess && `הניחוש האחרון: ${mostRecentGuess.guess_word}, ${(mostRecentGuess.similarity * 100).toFixed(2)}%`}</span>
        <GuessTable
          guesses={(gameState.isComplete || !mostRecentGuess ? sortedGuessesForTable : [mostRecentGuess, ...sortedGuessesForTable]).map(guess => ({id: guess.id, word: guess.guess_word, similarity: guess.similarity, rank: guess.rank, isCorrect: guess.is_correct, playerName: guess.player_nickname, order: guess.guess_order} satisfies DisplayGuess))}
          originalGuesses={gameState.guesses.map(guess => ({word: guess.guess_word, similarity: guess.similarity, isCorrect: guess.is_correct}))}
          recentWord={!gameState.isComplete ? mostRecentGuess?.guess_word : undefined}
        />
      </div>}

      {gameState.guesses.length === 0 && !gameState.isComplete && (
          <div className="text-center py-8 text-muted-foreground">
              עדיין אין ניחושים. תתחילו לנחש!
          </div>
      )}
      
      {!gameState.isComplete && (
        <div className="text-center pt-4">
          <Button onClick={leaveRoom} variant="outline">יציאה מהחדר</Button>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGameBoard;
