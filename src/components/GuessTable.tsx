
import { Guess } from "@/types/game";
import { getSimilarityClass } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GuessTableProps {
  guesses: Guess[];
  lastGuess?: Guess;
}

const GuessTable = ({ guesses, lastGuess }: GuessTableProps) => {
  if (guesses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        עדיין אין ניחושים. התחל לנחש!
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[60vh] border rounded-md">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow className="border-b">
            <TableHead className="text-right w-8 py-2">#</TableHead>
            <TableHead className="text-right w-16 py-2">מילה</TableHead>
            <TableHead className="text-center w-16 py-2">דירוג</TableHead>
            <TableHead className="text-center w-24 py-2">מתחמם?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Last guess - highlighted and separated */}
          {lastGuess && (
            <>
              <TableRow className="h-8 border-b-2 border-primary-200 dark:border-primary-700">
                <TableCell className="py-1 text-sm text-primary-600 dark:text-primary-400 font-medium">
                  {guesses.length + 1}
                </TableCell>
                <TableCell className="font-medium py-1 text-sm text-primary-600 dark:text-primary-400 truncate">
                  {lastGuess.word}
                </TableCell>
                <TableCell className="text-center py-1 text-sm text-primary-600 dark:text-primary-400 font-medium">
                  {(lastGuess.similarity * 100).toFixed(2)}%
                </TableCell>
                <TableCell className="text-center py-1">
                  {lastGuess.rank ? (
                    <div className="flex items-center gap-1">
                      <div 
                        className="h-3 bg-primary-500 rounded-sm flex-shrink-0" 
                        style={{ width: `${Math.max((1000 - lastGuess.rank) / 1000 * 100, 2)}%` }}
                      />
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                        {lastGuess.rank}/1000
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-primary-600 dark:text-primary-400">רחוק</span>
                  )}
                </TableCell>
              </TableRow>
            </>
          )}
          
          {/* Regular guesses */}
          {guesses.map((guess, index) => (
            <TableRow key={index} className={`h-8 ${guess.isCorrect ? "bg-green-500/20" : ""}`}>
              <TableCell className="py-1 text-xs">{guesses.length - index}</TableCell>
              <TableCell className="font-medium py-1 text-xs truncate">{guess.word}</TableCell>
              <TableCell className="text-center py-1 text-xs">
                {(guess.similarity * 100).toFixed(2)}%
              </TableCell>
              <TableCell className="text-center py-1">
                {guess.rank ? (
                  <div className="flex items-center gap-1">
                    <div 
                      className="h-3 bg-green-500 rounded-sm flex-shrink-0" 
                      style={{ width: `${Math.max((1000 - guess.rank) / 1000 * 100, 2)}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {guess.rank}/1000
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">רחוק</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GuessTable;
