
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GameBoard from "@/components/GameBoard";
import PageLayout from "@/components/PageLayout";
import AuthModal from "@/components/AuthModal";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { isLoading: gameLoading, gameState } = useGame();
  const { session, isLoading: authLoading, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">טוען...</div>
        </div>
      </PageLayout>
    );
  }

  if (gameLoading) {
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
      <div className="space-y-6">
        {/* User status bar */}
        <div className="flex justify-between items-center p-4 bg-background dark:bg-slate-800 rounded-lg border">
          {session ? (
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">
                מחובר כמשתמש
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                התנתק
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">
                משחק כאורח
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)}>
                התחבר / הירשם
              </Button>
            </div>
          )}
        </div>

        <GameBoard />
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    </PageLayout>
  );
};

export default Index;
