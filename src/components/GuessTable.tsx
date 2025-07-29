
import { Guess } from "@/types/game";
import { getSimilarityClass } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GuessTableProps {
  guesses: Guess[];
}

const GuessTable = ({ guesses }: GuessTableProps) => {
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
            <TableHead className="text-right w-12 py-2">#</TableHead>
            <TableHead className="text-right py-2">מילה</TableHead>
            <TableHead className="text-center w-20 py-2">דמיון</TableHead>
            <TableHead className="text-center w-16 py-2">דירוג</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guesses.map((guess, index) => (
            <TableRow key={index} className={`h-8 ${guess.isCorrect ? "bg-green-500/20" : ""}`}>
              <TableCell className="py-1 text-sm">{guesses.length - index}</TableCell>
              <TableCell className="font-medium py-1 text-sm">{guess.word}</TableCell>
              <TableCell className="text-center py-1">
                <div className="flex items-center gap-1">
                  <div 
                    className="h-4 bg-green-500 rounded-sm flex-shrink-0" 
                    style={{ width: `${Math.max(guess.similarity * 100, 2)}px` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {(guess.similarity * 100).toFixed(2)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center py-1 text-xs">
                {guess.rank ? `${guess.rank}` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GuessTable;
