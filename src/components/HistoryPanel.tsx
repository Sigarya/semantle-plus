
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useGame } from "@/context/GameContext";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { formatHebrewDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const HistoryPanel = () => {
  const { dailyWords, loadHistoricalGame } = useGame();
  const { isGameCompleted } = useUserCompletions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayHistoricalGame = async (date: string) => {
    setIsLoading(true);
    
    try {
      await loadHistoricalGame(date);
      navigate("/");
      
      toast({
        title: "משחק היסטורי נטען",
        description: `המשחק מתאריך ${formatHebrewDate(new Date(date))} נטען בהצלחה`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בטעינת המשחק",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sort dailyWords by date (newest first)
  const sortedDailyWords = [...dailyWords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-heebo">היסטורית משחקים</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedDailyWords.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            אין משחקים קודמים זמינים כרגע
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תאריך</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDailyWords.map((dailyWord) => {
                // Check if the date is in the past
                const gameDate = new Date(dailyWord.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = gameDate < today;

                const isCompleted = isGameCompleted(dailyWord.date);

                return (
                  <TableRow key={dailyWord.date}>
                    <TableCell>{formatHebrewDate(new Date(dailyWord.date))}</TableCell>
                    <TableCell>
                      {isPast && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayHistoricalGame(dailyWord.date)}
                          disabled={isLoading}
                          className={isCompleted ? "border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20" : ""}
                        >
                          {isLoading ? "טוען..." : isCompleted ? "הושלם 🎉" : "שחק"}
                        </Button>
                      )}
                      {!isPast && dailyWord.date === today.toISOString().split("T")[0] && (
                        <span className="text-primary-600 dark:text-primary-400">משחק נוכחי</span>
                      )}
                      {!isPast && dailyWord.date !== today.toISOString().split("T")[0] && (
                        <span className="text-muted-foreground">טרם זמין</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryPanel;
