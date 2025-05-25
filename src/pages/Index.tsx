
import { useEffect, useState } from "react";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import AuthModal from "@/components/AuthModal";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  console.log("Index: Component rendering");
  
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
    console.log("Index: useEffect - setting mounted to true");
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("Index: Auth state changed", {
      authLoading,
      session: !!session,
      currentUser: !!currentUser
    });
  }, [authLoading, session, currentUser]);

  useEffect(() => {
    console.log("Index: Game state changed", {
      gameLoading,
      gameState: gameState ? 'exists' : 'null'
    });
  }, [gameLoading, gameState]);

  // Show loading only while auth is initializing
  if (!mounted || authLoading) {
    console.log("Index: Showing loading state", { mounted, authLoading });
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
