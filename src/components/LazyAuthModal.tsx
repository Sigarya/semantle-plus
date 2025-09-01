import { lazy, Suspense } from 'react';

// Lazy load the AuthModal component
const AuthModal = lazy(() => import('./AuthModal'));

interface LazyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LazyAuthModal = ({ isOpen, onClose }: LazyAuthModalProps) => {
  // Only load the modal when it's actually needed
  if (!isOpen) return null;

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6">
          <div className="text-center">טוען...</div>
        </div>
      </div>
    }>
      <AuthModal isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
};

export default LazyAuthModal;