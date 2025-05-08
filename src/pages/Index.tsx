
import { useEffect, useState } from "react";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import { useGame } from "@/context/GameContext";

const Index = () => {
  const { isLoading } = useGame();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
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
