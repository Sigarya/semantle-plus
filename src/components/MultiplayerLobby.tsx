import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MultiplayerLobbyProps {
  onCreateRoom: (nickname: string) => void;
  onJoinRoom: (roomCode: string, nickname: string) => void;
  wordDate: string;
  isLoading: boolean;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  wordDate,
  isLoading
}) => {
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'lobby' | 'create' | 'join'>('lobby');
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const formattedDate = new Date(wordDate).toLocaleDateString('he-IL');

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      toast({
        title: "שם חסר",
        description: "יש להכניס שם לתצוגה במשחק",
        variant: "destructive"
      });
      return;
    }
    
    onCreateRoom(nickname.trim());
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      toast({
        title: "שם חסר",
        description: "יש להכניס שם לתצוגה במשחק",
        variant: "destructive"
      });
      return;
    }
    
    if (!roomCode.trim()) {
      toast({
        title: "קוד חדר חסר",
        description: "יש להכניס קוד חדר תקין",
        variant: "destructive"
      });
      return;
    }
    
    onJoinRoom(roomCode.trim().toUpperCase(), nickname.trim());
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {mode === 'lobby' && (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold font-heebo mb-2">שחק עם חברים</h2>
            <p className="text-muted-foreground">
              משחק מיום {formattedDate}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              אין צורך בהרשמה - פשוט הכנס שם ותתחיל לשחק!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105" 
                  onClick={() => setMode('create')}>
              <CardHeader className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 text-primary-500" />
                <CardTitle className="font-heebo">צור חדר חדש</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  צור חדר חדש ושתף את הקוד עם החברים שלך
                </p>
                <Button className="w-full">
                  צור חדר
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105" 
                  onClick={() => setMode('join')}>
              <CardHeader className="text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-2 text-primary-500" />
                <CardTitle className="font-heebo">הצטרף לחדר קיים</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  הזן קוד חדר שקיבלת מחבר והצטרף למשחק
                </p>
                <Button variant="outline" className="w-full">
                  הצטרף לחדר
                  <UserPlus className="w-4 h-4 mr-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heebo text-center">צור חדר חדש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">השם שלך במשחק</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="הכנס שם לתצוגה..."
                maxLength={20}
                dir="rtl"
              />
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground">
                לאחר יצירת החדר תקבל קוד חדר ייחודי שתוכל לשתף עם החברים שלך.
                כל השחקנים יראו את הניחושים של כולם בזמן אמת!
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateRoom}
                disabled={isLoading || !nickname.trim()}
                className="flex-1"
              >
                {isLoading ? "יוצר חדר..." : "צור חדר"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMode('lobby')}
                disabled={isLoading}
              >
                חזור
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'join' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heebo text-center">הצטרף לחדר קיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-code">קוד החדר</Label>
              <Input
                id="room-code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="הכנס קוד חדר (למשל: ABC123)"
                maxLength={6}
                className="text-center font-mono text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="join-nickname">השם שלך במשחק</Label>
              <Input
                id="join-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="הכנס שם לתצוגה..."
                maxLength={20}
                dir="rtl"
              />
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground">
                הזן את קוד החדר שקיבלת מהחבר שיצר את החדר ואת השם שברצונך שיופיע במשחק.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleJoinRoom}
                disabled={isLoading || !nickname.trim() || !roomCode.trim()}
                className="flex-1"
              >
                {isLoading ? "מצטרף..." : "הצטרף לחדר"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMode('lobby')}
                disabled={isLoading}
              >
                חזור
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiplayerLobby;