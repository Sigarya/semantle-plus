import { lazy, Suspense, ReactNode } from 'react';

// Lazy load heavy context providers
const GameProvider = lazy(() => import('@/context/GameContext').then(module => ({ default: module.GameProvider })));
const MultiplayerProvider = lazy(() => import('@/context/MultiplayerContext').then(module => ({ default: module.MultiplayerProvider })));

interface LazyContextProvidersProps {
  children: ReactNode;
}

const LazyContextProviders = ({ children }: LazyContextProvidersProps) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">מאתחל משחק...</div>
      </div>
    }>
      <GameProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">מאתחל רב-משתתפים...</div>
          </div>
        }>
          <MultiplayerProvider>
            {children}
          </MultiplayerProvider>
        </Suspense>
      </GameProvider>
    </Suspense>
  );
};

export default LazyContextProviders;