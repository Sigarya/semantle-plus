
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useGame } from "@/context/GameContext";
import { formatHebrewDate } from "@/lib/utils";

const Admin = () => {
  const { currentUser } = useAuth();
  const { dailyWords, setWordForDate } = useGame();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newWord, setNewWord] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect non-admin users
    if (!currentUser?.isAdmin) {
      toast({
        variant: "destructive",
        title: "גישה נדחתה",
        description: "אין לך הרשאה לצפות בדף זה",
      });
      navigate("/");
    }
  }, [currentUser, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWord.trim()) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אנא הכנס מילה",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await setWordForDate(newWord, selectedDate);
      setNewWord("");
    } catch (error) {
      console.error("Error setting word:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if not admin
  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-slate-900">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8 font-heebo">פאנל ניהול</h2>
          
          <div className="space-y-8">
            <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">הגדר מילה חדשה</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">תאריך</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="rtl:text-right"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="word">מילה</Label>
                    <Input
                      id="word"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="הכנס מילה חדשה..."
                      dir="rtl"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "שומר..." : "שמור מילה"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">מילים מוגדרות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-primary-200 dark:border-slate-700">
                        <th className="py-2 px-3 text-right">תאריך</th>
                        <th className="py-2 px-3 text-right">מילה</th>
                        <th className="py-2 px-3 text-right">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyWords
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((dailyWord) => (
                          <tr 
                            key={dailyWord.date}
                            className="border-b border-primary-100 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-slate-700/50"
                          >
                            <td className="py-2 px-3">{formatHebrewDate(new Date(dailyWord.date))}</td>
                            <td className="py-2 px-3">{dailyWord.word}</td>
                            <td className="py-2 px-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNewWord(dailyWord.word);
                                  setSelectedDate(dailyWord.date);
                                }}
                              >
                                ערוך
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="p-4 border-t border-primary-200 dark:border-slate-700 text-center text-sm text-muted-foreground">
        סמנטעל + &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Admin;
