import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdateNotification = () => {
  const [showUpdateAvailable, setShowUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('New content available, please refresh');
      setShowUpdateAvailable(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowUpdateAvailable(false);
  };

  const handleUpdate = async () => {
    if (needRefresh) {
      setIsUpdating(true);
      try {
        await updateServiceWorker(true);
      } catch (error) {
        console.error('Error updating service worker:', error);
        // Fallback to manual reload
        window.location.reload();
      }
    }
  };

  // Check for updates when the app gains focus
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

  // Show offline ready notification briefly
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => {
        setOfflineReady(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  if (showUpdateAvailable || needRefresh) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1 text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">עדכון זמין</div>
              <div className="text-sm">גרסה חדשה של האפליקציה זמינה</div>
            </div>
            <div className="flex gap-2 mr-2">
              <Button 
                size="sm" 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
                    מעדכן...
                  </>
                ) : (
                  'עדכן'
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={close}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="font-medium">האפליקציה מוכנה לעבודה ללא אינטרנט</div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
};