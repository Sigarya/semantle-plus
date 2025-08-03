import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAUpdateNotification = () => {
  const { updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      // לא עושים כלום
    },
    onOfflineReady() {
      // לא עושים כלום
    },
  });

  useEffect(() => {
    const handleFocus = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return null;
};
