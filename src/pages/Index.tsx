
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

  if (authLoading) {
    return <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">
            טוען אימות...
          </div>
        </div>
      </PageLayout>;
  }

  return <PageLayout>
      <div className="space-y-6">
        {/* User status bar */}
        <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-800 rounded-md border border-primary-200 dark:border-slate-700">
          {session && currentUser ? (
            <div className="flex items-center gap-4">
              <div className="text-primary-600 dark:text-primary-400">
                שלום, {currentUser.username}!
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="text-sm"
              >
                התנתק
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground">
                התחבר כדי לשמור את ההתקדמות שלך
              </div>
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600"
              >
                התחבר / הירשם
              </Button>
            </div>
          )}
        </div>

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
    </PageLayout>;
};

export default Index;
