// src/App.tsx

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
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Suspense, lazy, useState } from "react";

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

const AppContent = () => {
  const { showUsernameDialog, suggestedUsername, setUsernameSelected, hideUsernameDialog } = useAuth();
  
  // This state will track if the PWA banner is currently being displayed
  const [isPwaBannerVisible, setIsPwaBannerVisible] = useState(false);

  return (
    <>
      <GameProvider>
        <Toaster />
        <Sonner />
        <PWAUpdateNotification />
        
        {/* The PWA Prompt with proper visibility handling */}
        <PWAInstallPrompt 
          onInstallSuccess={() => setIsPwaBannerVisible(false)}
          onBannerVisibilityChange={setIsPwaBannerVisible}
        />
        
        {/* We use a state to add padding to the top of the app if the banner is visible */}
        <div className={isPwaBannerVisible ? "pt-16" : ""}>
          <UsernameSelectionDialog
            isOpen={showUsernameDialog}
            onClose={hideUsernameDialog}
            onUsernameSet={setUsernameSelected}
          />
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">טוען...</div>
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
        </div>
      </GameProvider>
    </>
  );
};

const App = () => {
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
};

export default App;