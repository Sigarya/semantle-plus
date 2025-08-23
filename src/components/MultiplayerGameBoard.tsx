import React, { useState, useCallback, useMemo } from "react";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Trophy, Target, Copy, Check } from "lucide-react";

const getProgressBarWidth = (rank: number): string => {
  if (!rank || rank <= 0) return '0%';
  const percentage = Math.min((rank / 1000) * 100, 100);
  return `${percentage}%`;
};

const MultiplayerGameBoard = () => {
  const { gameState, makeGuess, leaveRoom } = useMultiplayer();
  const { toast } = useToast();
  const [guessInput, setGuessInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const sortedGuesses = useMemo(() => {
    return [...gameState.guesses].sort((a, b) => b.similarity - a.similarity);
  }, [gameState.guesses]);

  const copyRoomCode = useCallback(async () => {
    const code = gameState.room?.room_code || '';
    if (!code) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
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

      {/* Room Info Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2"><Users className="h-5 w-5" /> חדר מרובה משתתפים</CardTitle>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-2">
            <span>תאריך: {new Date(gameState.room.word_date).toLocaleDateString('he-IL')}</span>
            <span>שחקנים: {gameState.players.length}</span>
            <span>קוד חדר: <button onClick={copyRoomCode} className="inline-flex items-center gap-1 ml-1 hover:bg-muted px-2 py-1 rounded transition-colors" title="לחץ להעתקה"><Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/20 text-base">{gameState.room.room_code}</Badge>{copiedCode ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}</button></span>
          </div>
        </CardHeader>
      </Card>
      
      {/* Guess Input Card */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> הכנס ניחוש</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleGuessSubmit} className="flex gap-2">
            <Input value={guessInput} onChange={(e) => setGuessInput(e.target.value)} placeholder="הקלד מילה..." disabled={isSubmitting || gameState.isComplete} className="flex-1" />
            <Button type="submit" disabled={isSubmitting || gameState.isComplete || !guessInput.trim()} className="min-w-[100px]">{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> שולח...</> : "שלח"}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Guesses Table Card */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> ניחושים ({gameState.guesses.length})</CardTitle></CardHeader>
        <CardContent>
          {gameState.guesses.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">עדיין אין ניחושים. תהיה הראשון!</div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* ✨ FIX: The '#' column is now hidden on small screens! ✨ */}
                    <TableHead className="hidden sm:table-cell text-right px-2">#</TableHead>
                    <TableHead className="text-right px-2">מילה</TableHead>
                    <TableHead className="text-right px-2">שחקן</TableHead>
                    <TableHead className="text-center px-2">קרבה</TableHead>
                    <TableHead className="text-center px-2">מתחמם?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGuesses.map((guess) => (
                    <TableRow key={guess.id} className={guess.is_correct ? "bg-green-500/20" : ""}>
                      {/* ✨ FIX: The data cell for '#' is also hidden on small screens. ✨ */}
                      <TableCell className="hidden sm:table-cell text-right py-1 px-2 text-xs">{guess.guess_order}</TableCell>
                      <TableCell className="font-medium text-right py-1 px-2 text-xs">{guess.guess_word}</TableCell>
                      <TableCell className="text-right py-1 px-2 text-xs"><Badge variant="outline">{guess.player_nickname}</Badge></TableCell>
                      <TableCell className="text-center py-1 px-2 text-xs">{`${(guess.similarity * 100).toFixed(2)}%`}</TableCell>
                      <TableCell className="py-1 px-2 text-xs">
                        {guess.rank && guess.rank > 0 ? (
                          <div className="flex items-center gap-1 justify-center">
                            <div className="relative w-16 h-3 bg-muted rounded-sm flex-shrink-0">
                              <div className="absolute top-0 left-0 h-full bg-green-500 rounded-sm transition-all duration-200 min-w-[2px]" style={{ width: getProgressBarWidth(guess.rank) }} />
                            </div>
                            <span className="text-muted-foreground font-heebo whitespace-nowrap">{guess.rank}/1000</span>
                          </div>
                        ) : (<span className="text-muted-foreground font-heebo">רחוק</span>)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!gameState.isComplete && (
        <div className="text-center">
          <Button onClick={leaveRoom} variant="outline">עזוב חדר</Button>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGameBoard;