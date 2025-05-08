
import { useEffect, useState } from "react";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import { useGame } from "@/context/GameContext";

const Index = () => {
  const { isLoading, gameState, initializeGame } = useGame();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensure game is properly initialized when component mounts
    // This helps with external window loading
    const init = async () => {
      try {
        await initializeGame();
        setMounted(true);
      } catch (error) {
        console.error("Failed to initialize game:", error);
        // Try once more after a short delay
        setTimeout(async () => {
          try {
            await initializeGame();
            setMounted(true);
          } catch (retryError) {
            console.error("Failed to initialize game after retry:", retryError);
            // Set mounted anyway to prevent eternal loading
            setMounted(true);
          }
        }, 1500);
      }
    };
    
    init();
  }, [initializeGame]);

  if (!mounted || isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400">טוען משחק...</div>
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
