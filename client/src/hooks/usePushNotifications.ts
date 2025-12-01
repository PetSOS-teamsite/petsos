import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalType) => void>;
    OneSignal?: OneSignalType;
  }
}

interface OneSignalType {
  init(config: {
    appId: string;
    safari_web_id?: string;
    allowLocalhostAsSecureOrigin?: boolean;
    serviceWorkerPath?: string;
    promptOptions?: Record<string, unknown>;
  }): Promise<void>;
  Notifications: {
    permission: boolean;
    requestPermission(): Promise<void>;
    addEventListener(event: string, callback: (granted: boolean) => void): void;
  };
  User: {
    PushSubscription: {
      id: string | null;
      optedIn: boolean;
      optIn(): Promise<void>;
      optOut(): Promise<void>;
      addEventListener(event: string, callback: (change: { current: { id: string | null; optedIn: boolean } }) => void): void;
    };
    addTag(key: string, value: string): Promise<void>;
    addTags(tags: Record<string, string>): Promise<void>;
  };
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isInitialized: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permissionGranted: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  error: string | null;
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported || !ONESIGNAL_APP_ID) {
      setIsLoading(false);
      return;
    }

    initOneSignal();
  }, []);

  const initOneSignal = async () => {
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      if (!document.querySelector('script[src*="onesignal"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        document.head.appendChild(script);
      }

      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: '/onesignal-sw.js',
          });

          setIsInitialized(true);
          setPermissionGranted(OneSignal.Notifications.permission);
          setIsSubscribed(OneSignal.User.PushSubscription.optedIn);

          OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
            setPermissionGranted(granted);
          });

          OneSignal.User.PushSubscription.addEventListener('change', (change) => {
            setIsSubscribed(change.current.optedIn);
            if (change.current.id && change.current.optedIn) {
              registerSubscriptionWithBackend(change.current.id);
            }
          });
        } catch (err) {
          console.error('OneSignal initialization error:', err);
          setError('Failed to initialize push notifications');
        } finally {
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error('Push notification setup error:', err);
      setError('Failed to set up push notifications');
      setIsLoading(false);
    }
  };

  const registerSubscriptionWithBackend = async (playerId: string) => {
    try {
      const language = localStorage.getItem('language') || 'en';
      const platform = detectPlatform();
      const browserInfo = navigator.userAgent;

      await apiRequest('POST', '/api/push/subscribe', {
        playerId,
        platform,
        browserInfo,
        language,
      });
    } catch (err) {
      console.error('Failed to register push subscription with backend:', err);
    }
  };

  const detectPlatform = (): string => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'web';
  };

  const subscribe = useCallback(async () => {
    if (!isInitialized || !window.OneSignal) {
      setError('Push notifications not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!permissionGranted) {
        await window.OneSignal.Notifications.requestPermission();
      }
      await window.OneSignal.User.PushSubscription.optIn();
      
      const language = localStorage.getItem('language') || 'en';
      await window.OneSignal.User.addTag('language', language);

      setIsSubscribed(true);
    } catch (err) {
      console.error('Subscribe error:', err);
      setError('Failed to subscribe to push notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, permissionGranted]);

  const unsubscribe = useCallback(async () => {
    if (!isInitialized || !window.OneSignal) {
      setError('Push notifications not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const playerId = window.OneSignal.User.PushSubscription.id;
      await window.OneSignal.User.PushSubscription.optOut();
      
      if (playerId) {
        await apiRequest('DELETE', '/api/push/unsubscribe', { playerId });
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('Failed to unsubscribe from push notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  return {
    isSupported,
    isInitialized,
    isSubscribed,
    isLoading,
    permissionGranted,
    subscribe,
    unsubscribe,
    error,
  };
}
