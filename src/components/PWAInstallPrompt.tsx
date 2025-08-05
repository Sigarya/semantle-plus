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

// Check if the app meets PWA criteria (fallback for when beforeinstallprompt doesn't fire)
const meetsPWACriteria = (): boolean => {
  // Check if we have a service worker
  if (!('serviceWorker' in navigator)) return false;
  
  // Check if we have a manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) return false;
  
  // Check if we're on HTTPS (required for PWA)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return false;
  
  return true;
};

export const PWAInstallPrompt = ({ onInstallSuccess, onBannerVisibilityChange }: PWAInstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasCheckedInstallability, setHasCheckedInstallability] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const showBanner = () => {
    if (!isVisible) {
      setIsVisible(true);
      onBannerVisibilityChange?.(true);
    }
  };

  const hideBanner = () => {
    if (isVisible) {
      setIsVisible(false);
      onBannerVisibilityChange?.(false);
    }
  };

  // Check if we should show the prompt on mount
  useEffect(() => {
    const checkAndShowPrompt = async () => {
      // Check if app is already installed
      const alreadyInstalled = await isAppAlreadyInstalled();
      
      // Only check if PWA is supported, should show prompt, and welcome dialog isn't showing
      if (isPWAInstallSupported() && shouldShowPrompt() && !isWelcomeDialogShowing() && !alreadyInstalled) {
        // If we already have a deferred prompt, show immediately
        if (deferredPrompt) {
          showBanner();
        } else {
          // Otherwise, wait a bit and check again (in case the event fires later)
          setTimeout(() => {
            if (deferredPrompt && !isVisible) {
              showBanner();
            }
          }, 2000);
        }
      }
    };

    // Check immediately
    checkAndShowPrompt();
    setHasCheckedInstallability(true);

    // Also check after a delay to catch late events
    const timer = setTimeout(checkAndShowPrompt, 3000);
    
    return () => clearTimeout(timer);
  }, [deferredPrompt, isVisible]);

  // Fallback mechanism - if no beforeinstallprompt event fires, use fallback
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isVisible && hasCheckedInstallability) {
        // Check if we should show the prompt and app meets PWA criteria
        const shouldShow = shouldShowPrompt() && !isWelcomeDialogShowing() && meetsPWACriteria();
        if (shouldShow) {
          console.log('Using fallback PWA prompt mechanism');
          setUseFallback(true);
          showBanner();
        }
      }
    }, 5000); // Wait 5 seconds before using fallback

    return () => clearTimeout(fallbackTimer);
  }, [deferredPrompt, isVisible, hasCheckedInstallability]);

  // Handle the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = async (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if app is already installed
      const alreadyInstalled = await isAppAlreadyInstalled();
      
      // Show the banner if conditions are met
      if (isPWAInstallSupported() && shouldShowPrompt() && !isWelcomeDialogShowing() && !alreadyInstalled) {
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
    if (useFallback) {
      // For fallback, we can't trigger the native prompt, so we show instructions
      console.log('Showing fallback installation instructions');
      // You could show a modal with manual installation instructions here
      secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
      hideBanner();
      return;
    }

    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
        onInstallSuccess();
        hideBanner();
      } else {
        console.log('User dismissed the install prompt');
        secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
        hideBanner();
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
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
    const remindTime = Date.now() - sevenDays;
    secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, remindTime);
    hideBanner();
  };

  // Debug logging
  useEffect(() => {
    const debugInfo = async () => {
      const alreadyInstalled = await isAppAlreadyInstalled();
      console.log('PWA Install Prompt Debug:', {
        isPWAInstallSupported: isPWAInstallSupported(),
        shouldShowPrompt: shouldShowPrompt(),
        isWelcomeDialogShowing: isWelcomeDialogShowing(),
        alreadyInstalled,
        meetsPWACriteria: meetsPWACriteria(),
        hasDeferredPrompt: !!deferredPrompt,
        useFallback,
        isVisible,
        hasCheckedInstallability
      });
    };
    debugInfo();
  }, [deferredPrompt, isVisible, hasCheckedInstallability, useFallback]);

  // For testing purposes - manually trigger the prompt
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'p' key to manually show the prompt for testing
      if (e.key === 'p' && e.ctrlKey) {
        console.log('Manual trigger for PWA prompt');
        if ((deferredPrompt || useFallback) && !isVisible) {
          showBanner();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [deferredPrompt, isVisible, useFallback]);

  if (!isVisible || (!deferredPrompt && !useFallback)) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-right">
            <div className="text-sm font-medium mb-1">התקן את סמנטעל + למסך הבית</div>
            <div className="text-xs opacity-90">גישה מהירה • עובד כמו אפליקציה • עדכונים אוטומטיים</div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse mr-4">
            <Button size="sm" onClick={handleInstall} disabled={isInstalling} className="bg-white text-blue-600 hover:bg-gray-100 text-xs px-3 py-1 h-auto">
              {isInstalling ? "מתקין..." : useFallback ? "איך להתקין" : "התקן"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleRemindLater} className="text-white hover:bg-white/20 text-xs px-2 py-1 h-auto">
              מאוחר יותר
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-white hover:bg-white/20 p-1 h-auto">
              <X size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};