// src/components/PwaUpdatePrompt.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    // Simple service worker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          // Check for updates every 10 seconds
          const checkForUpdate = () => {
            registration.update().then(() => {
              if (registration.waiting) {
                setNeedRefresh(true);
              }
            }).catch(console.error);
          };

          // Initial check
          if (registration.waiting) {
            setNeedRefresh(true);
          }

          // Listen for new service worker installing
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNeedRefresh(true);
                }
              });
            }
          });

          // Periodic check for updates
          const interval = setInterval(checkForUpdate, 10000);
          return () => clearInterval(interval);
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      window.location.reload();
    }
  };

  // If there's no update, we show nothing at all.
  if (!needRefresh) {
    return null;
  }

  // If an update is found, we show this beautiful, animated card!
  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <Card className="bg-background border-primary-500 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-sm text-right">
            <p className="font-bold">עדכון חדש זמין!</p>
            <p className="text-muted-foreground">רענן כדי לקבל את הגרסה האחרונה.</p>
          </div>
          <Button onClick={handleUpdate} size="sm" className="gap-2">
            <RefreshCw size={16} />
            רענן
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PwaUpdatePrompt;