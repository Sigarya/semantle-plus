import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PWAInstallContextType {
  deferredPrompt: any;
  isListening: boolean;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

interface PWAInstallProviderProps {
  children: ReactNode;
}

export const PWAInstallProvider: React.FC<PWAInstallProviderProps> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA Install Context: beforeinstallprompt event captured');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Set up the event listener as early as possible
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    setIsListening(true);

    console.log('PWA Install Context: Event listener attached');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      setIsListening(false);
    };
  }, []);

  const value: PWAInstallContextType = {
    deferredPrompt,
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