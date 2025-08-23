import React, { useState, useCallback, useMemo } from "react";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Trophy, Target, Copy, Check } from "lucide-react";

const MultiplayerGameBoard = () => {
  const { gameState, makeGuess, leaveRoom, timeoutState, dismissTimeoutWarning } = useMultiplayer();
  const { toast } = useToast();
  const [guessInput, setGuessInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sort guesses by similarity score (descending) for display
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
        // Fallback for insecure contexts or older browsers
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textarea);
        }
      }

      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
      // Last-resort fallback prompt
      try {
        window.prompt('העתק את קוד החדר:', code);
      } catch (_) {
        /* noop */
      }
    }
  }, [gameState.room?.room_code]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const handleGuessSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isSubmitting) return;

    console.log("Submitting guess:", guessInput);
    console.log("Current game state:", gameState);

    setIsSubmitting(true);

    try {
      await makeGuess(guessInput.trim());
      setGuessInput("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [guessInput, isSubmitting, makeGuess, toast, gameState]);

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Timeout Warning Screen */}
      {timeoutState?.isWarning && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="text-center">
            <CardTitle className="text-yellow-800 flex items-center justify-center gap-2">
              ⏰ אזהרת אי פעילות
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-yellow-700 mb-4">
              לא נשלחה אף מילה יותר מדי זמן. אם אתם עדיין משחקים, לחצו על חזרה למשחק על מנת להשאיר את החדר פתוח
            </p>
            <div className="text-2xl font-bold text-yellow-800 mb-4">
              {formatTime(timeoutState.warningTimeLeft)}
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={leaveRoom} variant="outline">
                עזוב חדר
              </Button>
              <Button onClick={dismissTimeoutWarning} className="bg-yellow-600 hover:bg-yellow-700">
                חזרה למשחק
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeout Closing Screen */}
      {timeoutState?.isClosing && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <CardTitle className="text-red-800 flex items-center justify-center gap-2">
              🚨 החדר נסגר בקרוב
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-700 mb-4">
              החדר ייסגר אוטומטית בגלל אי פעילות
            </p>
            <div className="text-2xl font-bold text-red-800 mb-4">
              {formatTime(timeoutState.closingTimeLeft)}
            </div>
            <Button onClick={leaveRoom} variant="outline">
              עזוב חדר
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Room Info */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            חדר מרובה משתתפים
          </CardTitle>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>
              קוד חדר: 
              <button
                onClick={copyRoomCode}
                className="inline-flex items-center gap-1 ml-1 hover:bg-muted px-2 py-1 rounded transition-colors"
                title="לחץ להעתקה"
              >
                <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/20">
                  {gameState.room.room_code}
                </Badge>
                {copiedCode ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              {copiedCode && (
                <span className="text-xs text-green-600 ml-2">הקוד הועתק</span>
              )}
            </span>
            <span>תאריך: {new Date(gameState.room.word_date).toLocaleDateString('he-IL')}</span>
            <span>שחקנים: {gameState.players.length}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            שחקנים בחדר
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {gameState.players.map((player) => (
              <Badge
                key={player.id}
                variant={player.id === gameState.currentPlayer?.id ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {player.nickname}
                {player.id === gameState.currentPlayer?.id && <span className="text-xs">(אתה)</span>}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guess Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            הכנס ניחוש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGuessSubmit} className="flex gap-2">
            <Input
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="הקלד מילה..."
              disabled={isSubmitting || gameState.isComplete}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || gameState.isComplete || !guessInput.trim()}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  שולח...
                </>
              ) : (
                "שלח"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Guesses Table - Sorted by Similarity Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            ניחושים ({gameState.guesses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gameState.guesses.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              עדיין אין ניחושים. תהיה הראשון!
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-right w-12 py-2 px-2">#</TableHead>
                    <TableHead className="text-right w-24 py-2 px-2">מילה</TableHead>
                    <TableHead className="text-right w-28 py-2 px-2">שחקן</TableHead>
                    <TableHead className="text-center w-20 py-2 px-2">קרבה</TableHead>
                    <TableHead className="text-center w-28 py-2 px-2">מתחמם?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGuesses.map((guess, index) => {
                    return (
                      <TableRow 
                        key={guess.id} 
                        className={`${guess.is_correct ? "bg-green-500/20" : ""}`}
                      >
                        <TableCell className="w-12 py-1 px-2 text-xs">
                          {guess.guess_order}
                        </TableCell>
                        <TableCell className="w-24 font-medium py-1 px-2 text-xs truncate">
                          {guess.guess_word}
                        </TableCell>
                        <TableCell className="w-28 py-1 px-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {guess.player_nickname}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-20 text-center py-1 px-2 text-xs">
                          {`${(guess.similarity * 100).toFixed(2)}%`}
                        </TableCell>
                        <TableCell className="w-28 text-center py-1 px-2">
                          {guess.rank && guess.rank > 0 ? (
                            <div className="flex items-center gap-1 justify-center">
                              <div className="relative w-16 h-3 bg-muted rounded-sm flex-shrink-0">
                                <div 
                                  className="absolute top-0 left-0 h-full bg-green-500 rounded-sm transition-all duration-200"
                                  style={{ width: `${Math.min((guess.rank / 1000) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground font-heebo whitespace-nowrap">
                                {guess.rank}/1000
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground font-heebo">רחוק</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Complete */}
      {gameState.isComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="text-green-800 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6" />
              המשחק הסתיים!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-700 mb-4">
              מישהו ניחש את המילה הנכונה! המשחק הסתיים.
            </p>
            <Button onClick={leaveRoom} variant="outline">
              עזוב חדר
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Leave Room Button */}
      {!gameState.isComplete && (
        <div className="text-center">
          <Button onClick={leaveRoom} variant="outline">
            עזוב חדר
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGameBoard;