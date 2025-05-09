
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
    <div className="overflow-auto max-h-96">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">#</TableHead>
            <TableHead className="text-right">מילה</TableHead>
            <TableHead className="text-center">דמיון</TableHead>
            <TableHead className="text-center">דירוג</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guesses.map((guess, index) => (
            <TableRow key={index} className={guess.isCorrect ? "bg-semantle-primary bg-opacity-20" : ""}>
              <TableCell>{guesses.length - index}</TableCell>
              <TableCell className="font-medium">{guess.word}</TableCell>
              <TableCell className={`text-center ${getSimilarityClass(guess.similarity)}`}>
                {(guess.similarity * 100).toFixed(2)}%
              </TableCell>
              <TableCell className="text-center">
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
