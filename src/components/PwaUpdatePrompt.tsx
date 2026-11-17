// src/components/PwaUpdatePrompt.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (disposed) return;
      registrations.forEach(registration => {
        const inspect = () => { if (!disposed && registration.waiting) setNeedRefresh(true); };
        const watchInstalling = () => {
          const worker = registration.installing;
          if (!worker) return;
          const changed = () => { if (!disposed && worker.state === 'installed' && navigator.serviceWorker.controller) setNeedRefresh(true); };
          worker.addEventListener('statechange', changed);
          cleanups.push(() => worker.removeEventListener('statechange', changed));
        };
        inspect();
        watchInstalling();
        registration.addEventListener('updatefound', watchInstalling);
        const interval = window.setInterval(() => { registration.update().then(inspect).catch(console.error); }, 60000);
        cleanups.push(() => { window.clearInterval(interval); registration.removeEventListener('updatefound', watchInstalling); });
      });
    }).catch(console.error);
    return () => { disposed = true; cleanups.forEach(cleanup => cleanup()); };
  }, []);

  const handleUpdate = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const waiting = registrations.find(registration => registration.waiting)?.waiting;
    if (!waiting) { window.location.reload(); return; }
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  // If there's no update, we show nothing at all.
  if (!needRefresh) {
    return null;
  }

  // If an update is found, we show this beautiful, animated card!
  return (
    <div className="update-prompt" role="status">
      <Card className="bg-background border-0 shadow-none">
        <CardContent className="p-0 flex items-center justify-between gap-4">
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