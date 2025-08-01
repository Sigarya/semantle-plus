
import { useEffect, useState } from "react";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import AuthModal from "@/components/AuthModal";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  
  const {
    isLoading: gameLoading
  } = useGame();
  
  const {
    isLoading: authLoading
  } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Remove verbose auth state logging for production
  // useEffect(() => {
  //   Debug logging would go here
  // }, [authLoading, session, currentUser]);

  // Remove verbose game state logging for production
  // useEffect(() => {
  //   Debug logging would go here
  // }, [gameLoading, gameState]);

  // Show loading only while auth is initializing
  if (!mounted || authLoading) {
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">
            טוען...
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {gameLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">
              טוען משחק...
            </div>
          </div>
        ) : (
          <GameBoard />
        )}
        
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </PageLayout>
  );
};

export default Index;
