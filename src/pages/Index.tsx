
import { useEffect, useState } from "react";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import { useGame } from "@/context/GameContext";

const Index = () => {
  const { isLoading, gameState, initializeGame } = useGame();
  const [mounted, setMounted] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure game is properly initialized when component mounts
    const init = async () => {
      console.log("Index: Attempting to initialize game, attempt:", initAttempts + 1);
      
      try {
        await initializeGame();
        console.log("Index: Game initialized successfully");
        setMounted(true);
        setError(null);
      } catch (error) {
        console.error("Index: Failed to initialize game:", error);
        setError("Failed to initialize game");
        
        // Only try again if we haven't exceeded max attempts
        if (initAttempts < 2) {
          console.log("Index: Will retry initialization after delay");
          setTimeout(() => {
            setInitAttempts(prev => prev + 1);
          }, 1500);
        } else {
          // Set mounted anyway after max attempts to prevent eternal loading
          console.log("Index: Max retry attempts reached, forcing mounted state");
          setMounted(true);
        }
      }
    };
    
    init();
  }, [initializeGame, initAttempts]);

  if (!mounted || isLoading) {
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">טוען משחק...</div>
          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 mt-2">
              שגיאה בטעינת המשחק. מנסה שוב...
            </div>
          )}
          {initAttempts > 0 && (
            <div className="text-sm text-muted-foreground mt-2">
              ניסיון {initAttempts + 1} מתוך 3...
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <GameBoard />
    </PageLayout>
  );
};

export default Index;
