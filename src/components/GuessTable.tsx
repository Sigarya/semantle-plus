
import React from "react";
import { Guess } from "@/types/game";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GuessTableProps {
  guesses: Guess[];
  originalGuesses: Guess[];
  showHeader?: boolean;
  flashingWord?: string | null;
}

const GuessTable = React.memo(({ guesses, originalGuesses, showHeader = true, flashingWord }: GuessTableProps) => {
  if (guesses.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        אין ניחושים קודמים
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-right w-12 py-2 px-2">#</TableHead>
              <TableHead className="text-right w-24 py-2 px-2">מילה</TableHead>
              <TableHead className="text-center w-20 py-2 px-2">קרבה</TableHead>
              <TableHead className="text-center w-28 py-2 px-2">מתחמם?</TableHead>
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {guesses.map((guess, index) => {
            // Find the original guess order in the chronological array
            const originalIndex = originalGuesses.findIndex((g, i) => 
              g.word === guess.word && g.similarity === guess.similarity && 
              // Handle duplicate words by checking if this is the same instance
              originalGuesses.slice(0, i).filter(prev => prev.word === guess.word).length === 
              guesses.slice(0, index).filter(prev => prev.word === guess.word).length
            );
            const guessNumber = originalIndex + 1;
            
            const isFlashing = flashingWord === guess.word;
            
            return (
              <TableRow 
                key={`${guess.word}-${index}`} 
                className={`${guess.isCorrect ? "bg-green-500/20" : ""} ${isFlashing ? "animate-pulse bg-yellow-200 dark:bg-yellow-900/50" : ""}`}
              >
                <TableCell className="w-12 py-1 px-2 text-xs">{guessNumber}</TableCell>
                <TableCell className="w-24 font-medium py-1 px-2 text-xs truncate">{guess.word}</TableCell>
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
  );
});

GuessTable.displayName = 'GuessTable';

export default GuessTable;
