// src/components/PWAInstallPrompt.tsx

import { GOOGLE_PLAY_URL } from "@/lib/appLinks";
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
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
        onInstallSuccess();
        hideBanner();
      } else {
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
    secureStorage.set(CACHE_KEYS.PWA_PROMPT_LAST_SHOWN, Date.now());
    hideBanner();
  };

  return (
    <section className="install-banner" aria-label="התקנת האפליקציה">
      <div className="install-banner-inner">
        <div className="install-copy">
          <strong>התקן את סמנטעל + למסך הבית</strong>
          <span>גישה מהירה • עובד כמו אפליקציה • עדכונים אוטומטיים</span>
        </div>
        <div className="install-actions">
          {deferredPrompt && <Button size="sm" onClick={handleInstall} disabled={isInstalling}>{isInstalling ? "מתקין..." : "התקן"}</Button>}
          <a className="google-play-link" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" aria-label="הורדת סמנטעל פלוס מ־Google Play">
            <svg viewBox="0 0 24 26" width="21" height="24" aria-hidden="true"><path fill="#32BBFF" d="M1 1 13 13 1 25Z"/><path fill="#32D396" d="m1 1 15 9-3 3Z"/><path fill="#FFBC00" d="m16 10 6 3-6 3-3-3Z"/><path fill="#F24E60" d="m1 25 12-12 3 3Z"/></svg>
            <span><small>להורדה ב־</small><b dir="ltr">Google Play</b></span>
          </a>
          <Button size="sm" variant="ghost" onClick={handleRemindLater} className="install-later">מאוחר יותר</Button>
        </div>
        <Button size="icon" variant="ghost" onClick={handleDismiss} className="install-close" aria-label="סגירת הצעת ההתקנה"><X size={18}/></Button>
      </div>
    </section>
  );
};
