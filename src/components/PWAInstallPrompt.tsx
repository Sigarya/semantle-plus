// src/components/PWAInstallPrompt.tsx

import { useState } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { secureStorage, CACHE_KEYS } from "@/lib/pwaUtils";
import { usePWAInstall } from "@/context/PWAInstallContext";

interface PWAInstallPromptProps {
  onInstallSuccess: () => void;
  onBannerVisibilityChange?: (isVisible: boolean) => void;
}

export const PWAInstallPrompt = ({ onInstallSuccess, onBannerVisibilityChange }: PWAInstallPromptProps) => {
  const { deferredPrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  const hideBanner = () => {
    onBannerVisibilityChange?.(false);
  };

  const handleInstall = async () => {
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

  // For testing purposes - manually trigger the prompt
  const handleManualTrigger = () => {
    console.log('Manual trigger for PWA prompt');
    if (deferredPrompt) {
      handleInstall();
    }
  };

  // Debug logging
  console.log('PWA Install Prompt Render:', {
    hasDeferredPrompt: !!deferredPrompt,
    isInstalling
  });

  if (!deferredPrompt) return null;

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
              {isInstalling ? "מתקין..." : "התקן"}
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