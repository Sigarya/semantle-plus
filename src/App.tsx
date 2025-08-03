
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GameProvider } from "@/context/GameContext";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { UsernameSelectionDialog } from "@/components/UsernameSelectionDialog";
import { Suspense, lazy } from "react";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const History = lazy(() => import("./pages/History"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component to handle username dialog within AuthProvider context
const AppContent = () => {
  const { showUsernameDialog, suggestedUsername, setUsernameSelected, hideUsernameDialog } = useAuth();

  // Debug logging
  console.log("AppContent: showUsernameDialog =", showUsernameDialog);
  console.log("AppContent: suggestedUsername =", suggestedUsername);

  return (
    <>
      <GameProvider>
        <Toaster />
        <Sonner />
        <PWAUpdateNotification />
        <UsernameSelectionDialog
          isOpen={showUsernameDialog}
          onClose={hideUsernameDialog}
          onUsernameSet={setUsernameSelected}
          suggestedUsername={suggestedUsername}
        />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-xl text-primary-500 dark:text-primary-400">
                טוען...
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </GameProvider>
    </>
  );
};

const App = () => {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("App: Critical error during render:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה בטעינת האפליקציה</h1>
          <p className="text-gray-600 mb-4">אירעה שגיאה בטעינת האפליקציה. אנא רענן את הדף.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            רענן דף
          </button>
        </div>
      </div>
    );
  }
};

export default App;
