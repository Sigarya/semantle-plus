import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import LazyMultiplayerGameBoard from "@/components/LazyMultiplayerGameBoard";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { useGame } from "@/context/GameContext";
import { useToast } from "@/components/ui/use-toast";

const Multiplayer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { gameState, isLoading, createRoom, joinRoom } = useMultiplayer();
  const { getCurrentGameDate } = useGame();
  
  const [wordDate, setWordDate] = useState<string>("");

  // Get word date from URL params or use current game date
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setWordDate(dateParam);
    } else {
      setWordDate(getCurrentGameDate());
    }
  }, [searchParams, getCurrentGameDate]);

  const handleCreateRoom = async (nickname: string) => {
    try {
      const roomCode = await createRoom(nickname, wordDate);
      toast({
        title: "חדר נוצר בהצלחה! 🎉",
        description: `קוד החדר: ${roomCode}`,
        duration: 5000
      });
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = async (roomCode: string, nickname: string) => {
    try {
      await joinRoom(roomCode, nickname);
      toast({
        title: "הצטרפת לחדר! 🎉",
        description: "המשחק הקבוצתי מתחיל",
        duration: 3000
      });
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {!gameState.room ? (
          <MultiplayerLobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            wordDate={wordDate}
            isLoading={isLoading}
          />
        ) : (
          <LazyMultiplayerGameBoard />
        )}
      </div>
    </PageLayout>
  );
};

export default Multiplayer;