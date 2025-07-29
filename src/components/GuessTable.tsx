
import { Guess } from "@/types/game";
import { getSimilarityClass } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GuessTableProps {
  guesses: Guess[];
}

const GuessTable = ({ guesses }: GuessTableProps) => {
  if (guesses.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        אין ניחושים קודמים
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="text-right w-12 py-2 px-2">#</TableHead>
            <TableHead className="text-right py-2 px-2">מילה</TableHead>
            <TableHead className="text-center w-20 py-2 px-2">קרבה</TableHead>
            <TableHead className="text-center w-28 py-2 px-2">מתחמם?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guesses.map((guess, index) => (
            <TableRow key={index} className={`${guess.isCorrect ? "bg-green-500/20" : ""}`}>
              <TableCell className="py-1 px-2 text-xs">{index + 1}</TableCell>
              <TableCell className="font-medium py-1 px-2 text-xs truncate">{guess.word}</TableCell>
              <TableCell className="text-center py-1 px-2 text-xs">
                {`${(guess.similarity * 100).toFixed(2)}%`}
              </TableCell>
              <TableCell className="text-center py-1 px-2">
                {guess.rank && guess.rank > 0 ? (
                  <div className="flex items-center gap-1 justify-center">
                    <div 
                      className="h-3 bg-green-500 rounded-sm flex-shrink-0" 
                      style={{ width: `${Math.min(guess.rank / 10, 100)}px` }}
                    />
                    <span className="text-xs text-muted-foreground font-heebo">
                      {guess.rank}/1000
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground font-heebo">רחוק</span>
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
