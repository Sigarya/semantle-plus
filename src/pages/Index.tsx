
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
      await initializeGame();
      setMounted(true);
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
