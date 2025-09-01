import { lazy, Suspense } from 'react';

// Lazy load the GameBoard component
const GameBoard = lazy(() => import('./GameBoard'));

const LazyGameBoard = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">טוען משחק...</div>
      </div>
    }>
      <GameBoard />
    </Suspense>
  );
};

export default LazyGameBoard;