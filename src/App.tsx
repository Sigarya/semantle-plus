// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PWAInstallProvider, usePWAInstall } from "@/context/PWAInstallContext";
import { UsernameSelectionDialog } from "@/components/UsernameSelectionDialog";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { hasInstalledRelatedApp, useAppDisplay } from "@/hooks/useAppDisplay";

// ✨ STEP 1: Import our new, smarter PWA update component. ✨
import PwaUpdatePrompt from "@/components/PwaUpdatePrompt";
import LazyContextProviders from "@/components/LazyContextProviders";

// Lazy load pages for code splitting (your original setup is perfect)
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const History = lazy(() => import("./pages/History"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const Multiplayer = lazy(() => import("./pages/Multiplayer"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// All your helper functions are great and remain unchanged.
const isWelcomeDialogShowing = (): boolean => { /* ... */ return !localStorage.getItem('semantle-has-visited'); };

const AppContent = () => {
  const { showUsernameDialog, setUsernameSelected, hideUsernameDialog } = useAuth();
  const { deferredPrompt } = usePWAInstall();
  const [isPwaBannerVisible, setIsPwaBannerVisible] = useState(false);
  const inApp = useAppDisplay();

  const dismissedThisVisit = useRef(false);
  const setBannerVisibility = (visible: boolean) => {
    if (!visible) dismissedThisVisit.current = true;
    setIsPwaBannerVisible(visible);
  };
  useEffect(() => {
    const handleInstalled = () => {
      dismissedThisVisit.current = true;
      setIsPwaBannerVisible(false);
    };
    window.addEventListener('appinstalled', handleInstalled);
    return () => window.removeEventListener('appinstalled', handleInstalled);
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (inApp) {
      setIsPwaBannerVisible(false);
      return;
    }
    const checkAndShowPrompt = async () => {
      const installed = await hasInstalledRelatedApp();
      if (!cancelled && installed) {
        setIsPwaBannerVisible(false);
        clearInterval(timer);
        return;
      }
      if (!cancelled && !installed && !dismissedThisVisit.current && !isWelcomeDialogShowing()) {
        setIsPwaBannerVisible(true);
        clearInterval(timer);
      }
    };
    const timer = setInterval(checkAndShowPrompt, 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [deferredPrompt, inApp]);

  // Your testing hooks and debug logs also remain.

  return (
    <>
      <LazyContextProviders>
        <Toaster />
        <Sonner />

        {/* ✨ STEP 2: We replace the old, simple notification with our new, interactive prompt. ✨ */}
        <PwaUpdatePrompt />

        {isPwaBannerVisible && (
          <PWAInstallPrompt
            onInstallSuccess={() => setBannerVisibility(false)}
            onBannerVisibilityChange={setBannerVisibility}
          />
        )}

        <div>
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
              {/* Your routing map is perfect and remains unchanged. */}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/history" element={<History />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/multiplayer" element={<Multiplayer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </div>
      </LazyContextProviders>
    </>
  );
};

// Your main App component structure is perfect and remains unchanged.
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <ThemeProvider>
            <PWAInstallProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </PWAInstallProvider>
          </ThemeProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
