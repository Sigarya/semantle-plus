
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useGame } from "@/context/GameContext";
import { DailyWord } from "@/types/game";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatHebrewDate } from "@/lib/utils";

const AdminPanel = () => {
  const { dailyWords, setWordForDate } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [newWord, setNewWord] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWord.trim()) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אנא הכנס מילה",
      });
      return;
    }

    try {
      setWordForDate(newWord, selectedDate);
      
      toast({
        title: "הצלחה",
        description: `המילה "${newWord}" נקבעה לתאריך ${formatHebrewDate(new Date(selectedDate))}`,
      });
      
      setNewWord("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בהגדרת המילה",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-semantle-dark border-semantle-primary">
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
              className="bg-semantle-primary hover:bg-semantle-secondary"
            >
              שמור מילה
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-semantle-dark border-semantle-primary">
        <CardHeader>
          <CardTitle className="text-xl">מילים מוגדרות</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תאריך</TableHead>
                <TableHead className="text-right">מילה</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyWords
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((dailyWord: DailyWord) => (
                  <TableRow key={dailyWord.date}>
                    <TableCell>{formatHebrewDate(new Date(dailyWord.date))}</TableCell>
                    <TableCell>{dailyWord.word}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
