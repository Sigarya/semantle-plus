import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window { __semantleInstallPrompt?: InstallPromptEvent | null }
}

interface PWAInstallContextType {
  deferredPrompt: InstallPromptEvent | null;
  takePrompt: () => InstallPromptEvent | null;
  isListening: boolean;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

interface PWAInstallProviderProps {
  children: ReactNode;
}

export const PWAInstallProvider: React.FC<PWAInstallProviderProps> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(() => window.__semantleInstallPrompt ?? null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };

    // Set up the event listener as early as possible
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    setDeferredPrompt(window.__semantleInstallPrompt ?? null);
    const handleInstalled = () => setDeferredPrompt(null);
    window.addEventListener('appinstalled', handleInstalled);
    setIsListening(true);

    console.log('PWA Install Context: Event listener attached');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      setIsListening(false);
    };
  }, []);

  const takePrompt = () => {
    const prompt = window.__semantleInstallPrompt ?? null;
    window.__semantleInstallPrompt = null;
    setDeferredPrompt(null);
    return prompt;
  };
  const value: PWAInstallContextType = {
    deferredPrompt,
    takePrompt,
    isListening,
  };

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = (): PWAInstallContextType => {
  const context = useContext(PWAInstallContext);
  if (context === undefined) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};
