
import GameDatePicker from "@/components/GameDatePicker";
import { format, parseISO } from "date-fns";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useGame } from "@/context/GameContext";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { useNavigate, Link } from "react-router-dom";
import { Users, ChevronRight, ChevronLeft } from "lucide-react";

const HistoryPanel = () => {
  const { dailyWords, loadHistoricalGame, isLoading: gameLoading } = useGame();
  const { isGameCompleted } = useUserCompletions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const isLoading = loadingDate !== null;
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 30;

  const handlePlayHistoricalGame = async (date: string) => {
    setLoadingDate(date);
    
    try {
      await loadHistoricalGame(date);
      navigate("/");
      
      toast({
        title: "משחק היסטורי נטען",
        description: `המשחק מתאריך ${format(parseISO(date), "dd/MM/yyyy")} נטען בהצלחה`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בטעינת המשחק",
      });
    } finally {
      setLoadingDate(null);
    }
  };

  // Sort dailyWords by date (newest first)
  const sortedDailyWords = [...dailyWords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const matchingWords = sortedDailyWords.filter(word => !selectedDate || word.date === selectedDate);
  const visibleWords = matchingWords.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = Math.ceil(matchingWords.length / pageSize);

  const changePage = (next: number) => {
    setPage(next);
    listRef.current?.focus({ preventScroll: true });
    listRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <Card className="history-list bg-background bg-card border-border">
      <CardHeader className="sr-only">
        <CardTitle className="text-xl font-heebo">היסטורית משחקים</CardTitle>
      </CardHeader>
      <CardContent ref={listRef} tabIndex={-1} aria-label="היסטורית משחקים">
        <div className="history-toolbar">
          <GameDatePicker value={selectedDate} dates={sortedDailyWords.map(word => word.date)} onChange={date => { setSelectedDate(date); setPage(0); }} label="חיפוש לפי תאריך" displayFormat="dd/MM/yyyy" disabled={gameLoading} />
          {selectedDate && <Button variant="ghost" size="sm" onClick={() => { setSelectedDate(""); setPage(0); }}>כל התאריכים</Button>}
        </div>
        {gameLoading ? <div className="text-center py-6 text-muted-foreground" role="status">טוען...</div> : matchingWords.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            אין משחקים קודמים זמינים כרגע
          </div>
        ) : (
          <Table className="history-table" aria-label="היסטורית משחקים">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">תאריך</TableHead>
                <TableHead className="text-center">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={`${selectedDate}-${page}`}>
              {visibleWords.map((dailyWord) => {
                // Check if the date is in the past
                const gameDate = new Date(dailyWord.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = gameDate < today;

                const isCompleted = isGameCompleted(dailyWord.date);

                return (
                  <TableRow key={dailyWord.date}>
                    <TableCell><bdi>{format(parseISO(dailyWord.date), "dd/MM/yyyy")}</bdi></TableCell>
                    <TableCell className="text-center">
                      <div className="history-actions">
                        {isPast && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayHistoricalGame(dailyWord.date)}
                              disabled={isLoading}
                              className={`history-play ${isCompleted ? "border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20" : ""}`}
                            >
                              {loadingDate === dailyWord.date ? "טוען..." : isCompleted ? "הושלם 🎉" : "שחק"}
                            </Button>
                            <Button asChild variant="outline" size="sm" className="history-friends gap-1">
                              <Link to={`/multiplayer?date=${dailyWord.date}`}><Users className="w-4 h-4" />עם חברים</Link>
                            </Button>
                          </>
                        )}
                        {!isPast && dailyWord.date === today.toISOString().split("T")[0] && (
                          <span className="text-primary">משחק נוכחי</span>
                        )}
                        {!isPast && dailyWord.date !== today.toISOString().split("T")[0] && (
                          <span className="text-muted-foreground">טרם זמין</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {pageCount > 1 && <nav className="history-pagination" aria-label="עמודי היסטוריה">
          <Button variant="outline" size="sm" disabled={page === 0 || isLoading} onClick={() => changePage(page - 1)} aria-label="עמוד קודם"><ChevronRight aria-hidden="true"/>הקודם</Button>
          <span role="status" aria-live="polite"><bdi>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, matchingWords.length)} / {matchingWords.length}</bdi></span>
          <Button variant="outline" size="sm" disabled={page + 1 >= pageCount || isLoading} onClick={() => changePage(page + 1)} aria-label="עמוד הבא">הבא<ChevronLeft aria-hidden="true"/></Button>
        </nav>}
      </CardContent>
    </Card>
  );
};

export default HistoryPanel;
