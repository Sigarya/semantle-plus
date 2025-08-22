import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, LogOut } from "lucide-react";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { useToast } from "@/components/ui/use-toast";
import { validateHebrewWord } from "@/lib/utils";
import { Link } from "react-router-dom";

const MultiplayerGameBoard: React.FC = () => {
  const { gameState, makeGuess, leaveRoom } = useMultiplayer();
  const { toast } = useToast();
  
  const [guessInput, setGuessInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashingWord, setFlashingWord] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (!gameState.isComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState.isComplete]);

  // Cleanup flash timeout on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const copyRoomCode = async () => {
    if (!gameState.room) return;
    
    try {
      await navigator.clipboard.writeText(gameState.room.room_code);
      toast({
        title: "קוד הועתק",
        description: "קוד החדר הועתק ללוח",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק את הקוד",
        variant: "destructive"
      });
    }
  };

  const handleGuessSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!guessInput.trim() || isSubmitting || gameState.isComplete) return;

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
    
    // Check if word was already guessed in this room
    const existingGuess = gameState.guesses.find(g => g.guess_word === wordToGuess);
    if (existingGuess) {
      // Clear input immediately
      setGuessInput("");
      
      // Flash the duplicate word
      setFlashingWord(wordToGuess);
      
      // Clear any existing flash timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      
      // Stop flashing after 2 seconds
      flashTimeoutRef.current = setTimeout(() => {
        setFlashingWord(null);
      }, 2000);
      
      setError(`המילה "${wordToGuess}" כבר נוחשה על ידי ${existingGuess.player_nickname}`);
      
      // Refocus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      return;
    }
    
    // Clear input immediately and set submission state
    setGuessInput("");
    setIsSubmitting(true);
    
    try {
      await makeGuess(wordToGuess);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "שגיאה בניחוש המילה";
      console.log('Error from makeGuess:', errorMessage);
      
      // Check for vocabulary errors
      if (errorMessage.includes("not found") || 
          errorMessage.includes("לא נמצא") ||
          errorMessage.includes("Word not found in vocabulary") ||
          errorMessage.includes("לא נמצאה במאגר")) {
        setError(`אני לא מכיר את המילה ${wordToGuess}`);
      } else if (errorMessage.includes("בעיה בגישה ל-API") || errorMessage.includes("API")) {
        setError(`בעיה בגישה לשרת - נסה שוב בעוד כמה שניות`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
      
      // Refocus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      toast({
        title: "עזבת את החדר",
        description: "חזרת למשחק הבודד",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה ביציאה מהחדר",
        variant: "destructive"
      });
    }
  };

  // Memoize the formatted date
  const formattedGameDate = useMemo(() => 
    gameState.room ? new Date(gameState.room.word_date).toLocaleDateString('he-IL') : '',
    [gameState.room?.word_date]
  );

  // Sort guesses by similarity for display
  const sortedGuesses = useMemo(() => 
    [...gameState.guesses].sort((a, b) => b.similarity - a.similarity),
    [gameState.guesses]
  );

  if (!gameState.room) {
    return <div className="text-center">טוען...</div>;
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto min-h-screen px-2 sm:px-4 pt-4 pb-20 sm:pb-24">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heebo">סמנטעל + קבוצתי</h2>
        <div className="text-sm text-muted-foreground mt-2">
          משחק מיום {formattedGameDate}
        </div>
      </div>

      {/* Room Info */}
      <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span className="font-medium">קוד החדר:</span>
                <Badge variant="secondary" className="font-mono text-lg px-3 py-1">
                  {gameState.room.room_code}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyRoomCode}
                  className="p-1 h-auto"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveRoom}
              className="self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4 ml-2" />
              עזוב חדר
            </Button>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">שחקנים:</span>
            {gameState.players.map((player) => (
              <Badge 
                key={player.id} 
                variant={player.id === gameState.currentPlayer?.id ? "default" : "secondary"}
                className="text-xs"
              >
                {player.nickname}
                {player.id === gameState.currentPlayer?.id && " (אתה)"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Game Content */}
      {gameState.isComplete ? (
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-2xl font-bold mb-4">
              המילה נמצאה! 🎉
            </div>
            <div className="text-xl mb-4">
              המילה היא: <span className="font-bold text-primary-500 dark:text-primary-400">{gameState.currentWord}</span>
            </div>
            <div className="text-muted-foreground mb-6">
              מספר ניחושים: {gameState.guesses.length}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button onClick={handleLeaveRoom} className="w-full sm:w-auto">
                חזור למשחק בודד
              </Button>
              <Link to="/history" className="block w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  משחק מיום אחר
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Input Form */}
          <form 
            onSubmit={handleGuessSubmit} 
            className="flex flex-row gap-2" 
            autoComplete="off"
          >
            <input
              ref={inputRef}
              type="search"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="נחש מילה..."
              disabled={isSubmitting || gameState.isComplete}
              dir="rtl"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="none"
              inputMode="text"
              className="flex-1 text-lg h-12 rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || !guessInput.trim() || gameState.isComplete}
              className="px-6 h-12"
            >
              {isSubmitting ? "שולח..." : "נחש"}
            </Button>
          </form>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Guesses Table */}
      {gameState.guesses.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">#</TableHead>
                    <TableHead className="text-center">מילה</TableHead>
                    <TableHead className="text-center">שחקן</TableHead>
                    <TableHead className="text-center">קרבה</TableHead>
                    <TableHead className="text-center">מתחמם?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGuesses.map((guess, index) => (
                    <TableRow 
                      key={guess.id}
                      className={`
                        ${guess.is_correct ? 'bg-green-50 dark:bg-green-900/20' : ''}
                        ${flashingWord === guess.guess_word ? 'animate-pulse bg-yellow-100 dark:bg-yellow-900/20' : ''}
                      `}
                    >
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {guess.guess_word}
                        {guess.is_correct && " ✅"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {guess.player_nickname}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 text-sm">
                            {`${(guess.similarity * 100).toFixed(2)}%`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {guess.rank && guess.rank > 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-sm font-medium">
                              {guess.rank}/1000
                            </div>
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                                style={{ 
                                  width: `${Math.min((guess.rank / 1000) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">רחוק</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {gameState.guesses.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground">
              עדיין לא הוכנסו ניחושים. תהיה הראשון לנחש!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiplayerGameBoard;