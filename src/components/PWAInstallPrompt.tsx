// src/components/PWAInstallPrompt.tsx

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { secureStorage, CACHE_KEYS } from "@/lib/pwaUtils";

interface PWAInstallPromptProps {
  onInstallSuccess: () => void;
  onBannerVisibilityChange?: (isVisible: boolean) => void;
}

// Check if PWA installation is supported
const isPWAInstallSupported = (): boolean => {
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore
      window.navigator.standalone === true) {
    return false;
  }

  // Check if beforeinstallprompt event is supported
  return 'onbeforeinstallprompt' in window;
};

// Check if welcome dialog is showing to avoid interference
const isWelcomeDialogShowing = (): boolean => {
  const hasVisited = localStorage.getItem('semantle-has-visited');
  return !hasVisited;
};

export const PWAInstallPrompt = ({ onInstallSuccess, onBannerVisibilityChange }: PWAInstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const shouldShowPrompt = (): boolean => {
    const lastShown = secureStorage.get<number>(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN);
    if (!lastShown) return true;
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    return Date.now() - lastShown > fourteenDays;
  };

  const showBanner = () => {
    setIsVisible(true);
    onBannerVisibilityChange?.(true);
  };

  const hideBanner = () => {
    setIsVisible(false);
    onBannerVisibilityChange?.(false);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show if PWA is supported, should show prompt, and welcome dialog isn't showing
      if (isPWAInstallSupported() && shouldShowPrompt() && !isWelcomeDialogShowing()) {
        // Add a small delay to ensure welcome dialog has priority
        setTimeout(() => {
          showBanner();
        }, 1000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
        onInstallSuccess(); // Notify parent component
        hideBanner();
      } else {
        // User dismissed the native prompt - still mark as shown
        secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
        hideBanner();
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      // Still mark as shown to avoid showing again immediately
      secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
      hideBanner();
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
    hideBanner();
  };

  const handleRemindLater = () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const remindTime = Date.now() - sevenDays; // Set it so 7 days from now it will be valid
    secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, remindTime);
    hideBanner();
  };
  
  if (!isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-right">
            <div className="text-sm font-medium mb-1">התקן את סמנטעל + למסך הבית</div>
            <div className="text-xs opacity-90">גישה מהירה • עובד כמו אפליקציה • עדכונים אוטומטיים</div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse mr-4">
            <Button size="sm" onClick={handleInstall} disabled={isInstalling} className="bg-white text-blue-600 hover:bg-gray-100 text-xs px-3 py-1 h-auto">{isInstalling ? "מתקין..." : "התקן"}</Button>
            <Button size="sm" variant="ghost" onClick={handleRemindLater} className="text-white hover:bg-white/20 text-xs px-2 py-1 h-auto">מאוחר יותר</Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-white hover:bg-white/20 p-1 h-auto"><X size={16} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};