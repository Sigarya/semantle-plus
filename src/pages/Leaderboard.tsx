
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/GameContext";
import { formatHebrewDate } from "@/lib/utils";
import PageLayout from "@/components/PageLayout";

const Leaderboard = () => {
  const { leaderboard, gameState, fetchLeaderboard } = useGame();
  
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <PageLayout title="טבלת המובילים">
      <div className="max-w-3xl mx-auto">
          
          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-heebo">
                  {`תוצאות ל-${formatHebrewDate(new Date(gameState.wordDate))}`}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLeaderboard()}
                  >
                    רענן
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  אין תוצאות זמינות להיום
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-primary-200 dark:border-slate-700">
                        <th className="py-2 px-3 text-right">מקום</th>
                        <th className="py-2 px-3 text-right">משתמש</th>
                        <th className="py-2 px-3 text-right">ניחושים</th>
                        <th className="py-2 px-3 text-right">שעה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => (
                        <tr 
                          key={index}
                          className="border-b border-primary-100 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-slate-700/50"
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {entry.rank === 1 && <span className="text-yellow-500">🏆</span>}
                              {entry.rank === 2 && <span className="text-slate-400">🥈</span>}
                              {entry.rank === 3 && <span className="text-amber-600">🥉</span>}
                              {entry.rank}
                            </div>
                          </td>
                          <td className="py-2 px-3">{entry.username}</td>
                          <td className="py-2 px-3">{entry.guessesCount}</td>
                          <td className="py-2 px-3">{formatTime(entry.completionTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  };

export default Leaderboard;
