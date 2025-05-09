
import { Guess } from "@/types/game";
import { getSimilarityClass } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface GuessTableProps {
  guesses: Guess[];
}

const GuessTable = ({ guesses }: GuessTableProps) => {
  // Function to calculate display rank (N/1000)
  const calculateDisplayRank = (rankInTop1000: number | null | undefined): string | null => {
    if (rankInTop1000 === null || rankInTop1000 === undefined) return null;
    
    const displayRank = Math.max(1, 1000 - rankInTop1000);
    return `${displayRank}/1000`;
  };
  
  // Function to calculate progress percentage for the progress bar
  const calculateProgressPercentage = (rankInTop1000: number | null | undefined): number => {
    if (rankInTop1000 === null || rankInTop1000 === undefined) return 0;
    
    const displayRank = Math.max(1, 1000 - rankInTop1000);
    return (displayRank / 1000) * 100;
  };

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
                {guess.is_in_top_1000 && guess.rank_in_top_1000 !== null ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-green-600 dark:text-green-400">
                      {calculateDisplayRank(guess.rank_in_top_1000)}
                    </span>
                    <Progress 
                      value={calculateProgressPercentage(guess.rank_in_top_1000)} 
                      className="h-1.5 w-16 bg-gray-200 dark:bg-slate-600"
                    />
                  </div>
                ) : guess.rank ? `${guess.rank}` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GuessTable;
