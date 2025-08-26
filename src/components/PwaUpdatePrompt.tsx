// src/components/PwaUpdatePrompt.tsx

import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

function PwaUpdatePrompt() {
  // This special hook from vite-plugin-pwa watches for updates.
  // When `needRefresh` is true, it means a new version is downloaded and waiting.
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // This function tells the service worker to activate the new version
  // and reload the page. The `true` parameter forces it to reload all tabs.
  const handleUpdate = () => {
    updateServiceWorker(true);
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