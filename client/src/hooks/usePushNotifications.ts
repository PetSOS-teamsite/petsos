import { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from 'firebase/messaging';
import { apiRequest } from '@/lib/queryClient';

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

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function initializeFirebaseApp(): { app: FirebaseApp; messaging: Messaging } | null {
  if (firebaseApp && messaging) {
    return { app: firebaseApp, messaging };
  }
  
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    console.warn('Firebase configuration not set - push notifications disabled');
    return null;
  }
  
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
    messaging = getMessaging(firebaseApp);
    
    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        new Notification(payload.notification.title || 'PetSOS', {
          body: payload.notification.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        });
      }
    });
    
    return { app: firebaseApp, messaging };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    if (!FIREBASE_CONFIG.apiKey) {
      console.log('Firebase not configured - push notifications disabled');
      setIsLoading(false);
      return;
    }

    initFirebase();
  }, []);

  const initFirebase = async () => {
    try {
      const firebase = initializeFirebaseApp();
      if (!firebase) {
        setIsLoading(false);
        return;
      }

      setIsInitialized(true);
      
      const permission = Notification.permission;
      setPermissionGranted(permission === 'granted');
      
      if (permission === 'granted') {
        await checkExistingSubscription(firebase.messaging);
      }
    } catch (err) {
      console.error('Firebase initialization error:', err);
      setError('Failed to initialize push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingSubscription = async (msg: Messaging) => {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      
      if (registration) {
        const token = await getToken(msg, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        
        if (token) {
          setCurrentToken(token);
          setIsSubscribed(true);
        }
      }
    } catch (err) {
      console.log('No existing subscription found');
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration.scope);
        return registration;
      } catch (err) {
        console.error('Service Worker registration failed:', err);
        throw err;
      }
    }
    throw new Error('Service Worker not supported');
  };

  const registerSubscriptionWithBackend = async (token: string) => {
    try {
      const language = localStorage.getItem('language') || 'en';
      const platform = detectPlatform();
      const browserInfo = navigator.userAgent;

      await apiRequest('POST', '/api/push/subscribe', {
        token,
        provider: 'fcm',
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
    if (!isInitialized || !messaging) {
      setError('Push notifications not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');
      
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return;
      }

      const registration = await registerServiceWorker();
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        setCurrentToken(token);
        await registerSubscriptionWithBackend(token);
        setIsSubscribed(true);
      } else {
        setError('Failed to get push notification token');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      setError('Failed to subscribe to push notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const unsubscribe = useCallback(async () => {
    if (!isInitialized) {
      setError('Push notifications not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (currentToken) {
        await apiRequest('DELETE', '/api/push/unsubscribe', { token: currentToken });
      }

      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (registration) {
        await registration.unregister();
      }

      setCurrentToken(null);
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('Failed to unsubscribe from push notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, currentToken]);

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
