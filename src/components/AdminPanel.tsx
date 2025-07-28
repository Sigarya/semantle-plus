
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
import { supabase } from "@/integrations/supabase/client";

const AdminPanel = () => {
  const { dailyWords, setWordForDate } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [newWord, setNewWord] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

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

    try {
      // Format date for the new server (dd/mm/yyyy)
      const dateObj = new Date(selectedDate + 'T12:00:00');
      const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
      
      // Call the secure edge function instead of setting word directly
      const { data, error } = await supabase.functions.invoke("set-daily-word", {
        body: { 
          date: formattedDate,
          word: newWord.trim()
        }
      });

      if (error) {
        console.error("Error calling edge function:", error);
        throw new Error("שגיאה בקשת השרת");
      }

      if (data?.error) {
        console.error("Server error:", data.error);
        throw new Error(data.error);
      }
      
      // Also update the local Supabase database
      await setWordForDate(newWord, selectedDate);
      
      toast({
        title: "הצלחה",
        description: `המילה "${newWord}" נקבעה לתאריך ${formatHebrewDate(new Date(selectedDate))} בשני השרתים`,
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

  // Function to set word on external server
  const handleSetWordOnServer = async (word: string, date: string) => {
    try {
      console.log("Setting word on server:", { word, date });
      
      // Format date for the API (dd/mm/yyyy)
      const dateObj = new Date(date + 'T12:00:00');
      const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
      
      console.log("Formatted date:", formattedDate);
      
      // Call the secure edge function
      console.log("Calling edge function set-daily-word...");
      const { data, error } = await supabase.functions.invoke("set-daily-word", {
        body: { 
          date: formattedDate,
          word: word.trim()
        }
      });

      console.log("Edge function response:", { data, error });

      if (error) {
        console.error("Error calling edge function:", error);
        throw new Error(`שגיאה בקשת השרת: ${error.message || error}`);
      }

      if (data?.error) {
        console.error("Server error:", data.error);
        throw new Error(data.error);
      }
      
      toast({
        title: "הצלחה",
        description: `המילה "${word}" נקבעה בהצלחה בשרת החיצוני לתאריך ${formatHebrewDate(dateObj)}`,
      });
      
    } catch (error) {
      console.error("Full error in handleSetWordOnServer:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בהגדרת המילה בשרת החיצוני",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 dark:text-white">הגדר מילה חדשה</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="date" className="text-gray-700 dark:text-gray-300">תאריך</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rtl:text-right bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="word" className="text-gray-700 dark:text-gray-300">מילה</Label>
              <Input
                id="word"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="הכנס מילה חדשה..."
                dir="rtl"
                className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
              />
            </div>
            
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              שמור מילה
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 dark:text-white">מילים מוגדרות</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right text-gray-700 dark:text-gray-300">תאריך</TableHead>
                <TableHead className="text-right text-gray-700 dark:text-gray-300">מילה</TableHead>
                <TableHead className="text-right text-gray-700 dark:text-gray-300">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyWords
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((dailyWord: DailyWord) => (
                  <TableRow key={dailyWord.date} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <TableCell className="text-gray-900 dark:text-white">{formatHebrewDate(new Date(dailyWord.date))}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{dailyWord.word}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewWord(dailyWord.word);
                            setSelectedDate(dailyWord.date);
                          }}
                          className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600"
                        >
                          ערוך
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSetWordOnServer(dailyWord.word, dailyWord.date);
                          }}
                        >
                          הגדר
                        </Button>
                      </div>
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
