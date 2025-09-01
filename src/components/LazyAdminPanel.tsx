import { lazy, Suspense } from 'react';

// Lazy load the AdminPanel component
const AdminPanel = lazy(() => import('./AdminPanel'));

const LazyAdminPanel = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">טוען פאנל ניהול...</div>
      </div>
    }>
      <AdminPanel />
    </Suspense>
  );
};

export default LazyAdminPanel;