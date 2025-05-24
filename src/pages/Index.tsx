import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import AuthModal from "@/components/AuthModal";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
const Index = () => {
  const {
    isLoading: gameLoading,
    gameState
  } = useGame();
  const {
    session,
    currentUser,
    isLoading: authLoading,
    signOut
  } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">טוען...</div>
        </div>
      </PageLayout>;
  }
  if (authLoading || gameLoading) {
    return <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">
            {authLoading ? "טוען..." : "טוען משחק..."}
          </div>
        </div>
      </PageLayout>;
  }
  return <PageLayout>
      <div className="space-y-6">
        {/* User status bar */}
        

        <GameBoard />
        
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </PageLayout>;
};
export default Index;