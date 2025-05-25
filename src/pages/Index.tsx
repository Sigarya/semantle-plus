
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState<string | null>(null);
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    console.log("Index: useEffect - setting mounted to true");
    setMounted(true);
    
    // Set a timeout for auth loading to prevent infinite loading
    const timeout = setTimeout(() => {
      if (authLoading) {
        console.log("Index: Auth loading timeout reached");
        setAuthTimeout(true);
      }
    }, 15000); // 15 seconds timeout
    
    return () => clearTimeout(timeout);
  }, [authLoading]);

  useEffect(() => {
    console.log("Index: Auth state changed", { 
      authLoading, 
      session: !!session, 
      currentUser: !!currentUser,
      authTimeout
    });
  }, [authLoading, session, currentUser, authTimeout]);

  useEffect(() => {
    console.log("Index: Game state changed", { 
      gameLoading, 
      gameState: gameState ? 'exists' : 'null' 
    });
  }, [gameLoading, gameState]);

  // Error boundary-like behavior
  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-red-500 mb-4">שגיאה: {error}</div>
          <Button onClick={() => {
            setError(null);
            window.location.reload();
          }}>
            רענן דף
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (!mounted) {
    console.log("Index: Not mounted yet, showing loading");
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">טוען...</div>
        </div>
      </PageLayout>
    );
  }

  // If auth is taking too long, show the app anyway
  if (authLoading && !authTimeout) {
    console.log("Index: Auth loading, showing auth loading message");
    return (
      <PageLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-xl text-primary-500 dark:text-primary-400 mb-4">
            טוען אימות...
          </div>
          <Button 
            variant="outline" 
            onClick={() => setAuthTimeout(true)}
            className="mt-4"
          >
            המשך בלי אימות
          </Button>
        </div>
      </PageLayout>
    );
  }

  // If auth timeout occurred, treat as no session
  const effectiveSession = authTimeout ? null : session;
  const effectiveCurrentUser = authTimeout ? null : currentUser;

  try {
    return (
      <PageLayout>
        <div className="space-y-6">
          {/* User status bar */}
          {effectiveCurrentUser && (
            <div className="bg-primary-50 dark:bg-slate-800 p-4 rounded-md border border-primary-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-primary-700 dark:text-primary-300">
                    שלום, {effectiveCurrentUser.username}!
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={signOut}
                  className="border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-300"
                >
                  התנתק
                </Button>
              </div>
            </div>
          )}

          {/* Auth timeout notification */}
          {authTimeout && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
              <div className="text-yellow-800 dark:text-yellow-200 text-sm">
                האימות לוקח זמן רב מהרגיל. המשחק נטען ללא אימות.
              </div>
            </div>
          )}

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
  } catch (renderError) {
    console.error("Index: Render error:", renderError);
    setError(renderError instanceof Error ? renderError.message : "שגיאה לא ידועה");
    return null;
  }
};

export default Index;
