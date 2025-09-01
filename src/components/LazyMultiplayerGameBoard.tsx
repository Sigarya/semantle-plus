import { lazy, Suspense } from 'react';

// Lazy load the MultiplayerGameBoard component
const MultiplayerGameBoard = lazy(() => import('./MultiplayerGameBoard'));

const LazyMultiplayerGameBoard = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">טוען משחק מרובה משתתפים...</div>
      </div>
    }>
      <MultiplayerGameBoard />
    </Suspense>
  );
};

export default LazyMultiplayerGameBoard;