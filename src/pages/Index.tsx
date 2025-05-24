
import { useEffect, useState } from "react";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import { useGame } from "@/context/GameContext";

const Index = () => {
  const { isLoading, gameState } = useGame();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Simple mounting check - the GameContext handles all initialization
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">טוען משחק...</div>
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
