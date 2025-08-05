// PWA utility functions for enhanced offline functionality

// Check if the app is running in standalone mode (PWA)
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         // @ts-ignore
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Check if the user is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Cache keys for offline data
export const CACHE_KEYS = {
  DAILY_WORDS: 'semantle-daily-words',
  SAMPLE_RANKS: 'semantle-sample-ranks',
  USER_PROFILE: 'semantle-user-profile',
  GAME_STATE: 'semantle-game-state',
  PENDING_GUESSES: 'semantle-pending-guesses',
  PWA_PROMPT_LAST_SHOWN: 'pwa-prompt-last-shown',
} as const;

// Enhanced localStorage with error handling
export const secureStorage = {
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: '1.0'
      }));
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  },

  get: <T>(key: string, maxAge?: number): T | null => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Check if data is too old
      if (maxAge && (Date.now() - parsed.timestamp) > maxAge) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      // Clean up corrupted data
      localStorage.removeItem(key);
      return null;
    }
  },

  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      // Only clear our app's data, not everything
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
};

// Queue for offline actions
interface QueuedAction {
  id: string;
  type: 'guess' | 'score' | 'profile_update';
  data: any;
  timestamp: number;
  retries: number;
}

export const offlineQueue = {
  add: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): void => {
    const queue = secureStorage.get<QueuedAction[]>(CACHE_KEYS.PENDING_GUESSES) || [];
    const newAction: QueuedAction = {
      ...action,
      id: `${action.type}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0
    };
    
    queue.push(newAction);
    secureStorage.set(CACHE_KEYS.PENDING_GUESSES, queue);
  },

  getAll: (): QueuedAction[] => {
    return secureStorage.get<QueuedAction[]>(CACHE_KEYS.PENDING_GUESSES) || [];
  },

  remove: (id: string): void => {
    const queue = secureStorage.get<QueuedAction[]>(CACHE_KEYS.PENDING_GUESSES) || [];
    const filtered = queue.filter(action => action.id !== id);
    secureStorage.set(CACHE_KEYS.PENDING_GUESSES, filtered);
  },

  clear: (): void => {
    secureStorage.remove(CACHE_KEYS.PENDING_GUESSES);
  }
};

// Check if we have cached data for offline play
export const hasOfflineData = (): boolean => {
  const dailyWords = secureStorage.get(CACHE_KEYS.DAILY_WORDS);
  return dailyWords && Array.isArray(dailyWords) && dailyWords.length > 0;
};

// Get offline notification message
export const getOfflineMessage = (): string => {
  if (hasOfflineData()) {
    return 'אתה במצב לא מקוון, אבל אתה יכול להמשיך לשחק עם נתונים שמורים';
  } else {
    return 'אתה במצב לא מקוון. התחבר לאינטרנט כדי לשחק';
  }
};

// Handle online/offline status changes
export const setupOnlineStatusHandlers = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  const handleOnline = () => {
    console.log('App is now online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('App is now offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Service worker utilities
export const swUtils = {
  // Check if service worker is supported
  isSupported: (): boolean => {
    return 'serviceWorker' in navigator;
  },

  // Get service worker registration
  getRegistration: async (): Promise<ServiceWorkerRegistration | null> => {
    if (!swUtils.isSupported()) return null;
    
    try {
      return await navigator.serviceWorker.getRegistration();
    } catch (error) {
      console.warn('Failed to get service worker registration:', error);
      return null;
    }
  },

  // Check for updates manually
  checkForUpdate: async (): Promise<boolean> => {
    const registration = await swUtils.getRegistration();
    if (!registration) return false;

    try {
      await registration.update();
      return true;
    } catch (error) {
      console.warn('Failed to check for service worker updates:', error);
      return false;
    }
  }
};