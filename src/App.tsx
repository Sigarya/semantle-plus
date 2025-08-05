// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GameProvider } from "@/context/GameContext";
import { PWAInstallProvider, usePWAInstall } from "@/context/PWAInstallContext";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { UsernameSelectionDialog } from "@/components/UsernameSelectionDialog";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Suspense, lazy, useState, useEffect } from "react";
import { secureStorage, CACHE_KEYS } from "@/lib/pwaUtils";

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

// Check if PWA installation is supported
const isPWAInstallSupported = (): boolean => {
  if (window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore
      window.navigator.standalone === true) {
    return false;
  }
  return 'onbeforeinstallprompt' in window;
};

// Check if welcome dialog is showing to avoid interference
const isWelcomeDialogShowing = (): boolean => {
  const hasVisited = localStorage.getItem('semantle-has-visited');
  return !hasVisited;
};

// Check if we should show the prompt (once every 14 days)
const shouldShowPrompt = (): boolean => {
  const lastShown = secureStorage.get<number>(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN);
  if (!lastShown) return true;
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  return Date.now() - lastShown > fourteenDays;
};

// Check if app is already installed using getInstalledRelatedApps
const isAppAlreadyInstalled = async (): Promise<boolean> => {
  if ('getInstalledRelatedApps' in navigator) {
    try {
      // @ts-ignore
      const relatedApps = await navigator.getInstalledRelatedApps();
      return relatedApps.length > 0;
    } catch (error) {
      console.warn('Error checking installed related apps:', error);
    }
  }
  return false;
};

const AppContent = () => {
  const { showUsernameDialog, setUsernameSelected, hideUsernameDialog } = useAuth();
  const { deferredPrompt } = usePWAInstall();
  
  // This state will track if the PWA banner is currently being displayed
  const [isPwaBannerVisible, setIsPwaBannerVisible] = useState(false);

  // Check if we should show the PWA prompt
  useEffect(() => {
    const checkAndShowPrompt = async () => {
      if (!deferredPrompt) return;

      // Check if app is already installed
      const alreadyInstalled = await isAppAlreadyInstalled();
      
      // Only show if PWA is supported, should show prompt, and welcome dialog isn't showing
      if (isPWAInstallSupported() && shouldShowPrompt() && !isWelcomeDialogShowing() && !alreadyInstalled) {
        // Add a small delay to ensure welcome dialog has priority
        setTimeout(() => {
          setIsPwaBannerVisible(true);
        }, 1000);
      }
    };

    checkAndShowPrompt();
  }, [deferredPrompt]);

  // For testing purposes - manually trigger the prompt
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'p' key to manually show the prompt for testing
      if (e.key === 'p' && e.ctrlKey) {
        console.log('Manual trigger for PWA prompt');
        if (deferredPrompt && !isPwaBannerVisible) {
          setIsPwaBannerVisible(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [deferredPrompt, isPwaBannerVisible]);

  // Debug logging
  useEffect(() => {
    const debugInfo = async () => {
      const alreadyInstalled = await isAppAlreadyInstalled();
      console.log('PWA AppContent Debug:', {
        isPWAInstallSupported: isPWAInstallSupported(),
        shouldShowPrompt: shouldShowPrompt(),
        isWelcomeDialogShowing: isWelcomeDialogShowing(),
        alreadyInstalled,
        hasDeferredPrompt: !!deferredPrompt,
        isPwaBannerVisible
      });
    };
    debugInfo();
  }, [deferredPrompt, isPwaBannerVisible]);

  return (
    <>
      <GameProvider>
        <Toaster />
        <Sonner />
        <PWAUpdateNotification />
        
        {/* The PWA Prompt - only render when banner should be visible */}
        {isPwaBannerVisible && (
          <PWAInstallPrompt 
            onInstallSuccess={() => setIsPwaBannerVisible(false)}
            onBannerVisibilityChange={setIsPwaBannerVisible}
          />
        )}
        
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
          <PWAInstallProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </PWAInstallProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;