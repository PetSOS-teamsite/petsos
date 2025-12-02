import { useState, useEffect, useCallback, useRef } from 'react';

interface OfflineEmergencyState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  queuedCount: number;
}

let serviceWorkerRegistered = false;
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function useOfflineEmergency() {
  const [state, setState] = useState<OfflineEmergencyState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isServiceWorkerReady: false,
    queuedCount: 0,
  });
  
  const hasInitialized = useRef(false);

  const ensureServiceWorkerReady = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    if (!serviceWorkerRegistered && !registrationPromise) {
      registrationPromise = navigator.serviceWorker.register('/offline-sw.js', {
        scope: '/',
      }).then(registration => {
        console.log('[useOfflineEmergency] Service worker registered:', registration.scope);
        serviceWorkerRegistered = true;
        return registration;
      }).catch(error => {
        console.error('[useOfflineEmergency] Service worker registration failed:', error);
        registrationPromise = null;
        return null;
      });
    }

    if (registrationPromise) {
      await registrationPromise;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      setState(prev => ({ ...prev, isServiceWorkerReady: true }));
      return registration;
    } catch {
      return null;
    }
  }, []);

  const getQueuedCount = useCallback(async (): Promise<number> => {
    if (!('serviceWorker' in navigator)) {
      return 0;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const controller = registration.active || navigator.serviceWorker.controller;
      
      if (!controller) {
        return 0;
      }

      return new Promise<number>((resolve) => {
        const messageChannel = new MessageChannel();
        const timeout = setTimeout(() => resolve(0), 2000);
        
        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          resolve(event.data.count || 0);
        };

        controller.postMessage(
          { type: 'GET_QUEUED_COUNT' },
          [messageChannel.port2]
        );
      });
    } catch {
      return 0;
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const controller = registration.active || navigator.serviceWorker.controller;
      
      if (controller) {
        controller.postMessage({ type: 'PROCESS_QUEUE' });
      }
    } catch (error) {
      console.error('[useOfflineEmergency] Failed to process queue:', error);
    }
  }, []);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    ensureServiceWorkerReady().then(() => {
      if (navigator.onLine) {
        console.log('[useOfflineEmergency] Online at startup, processing any queued requests');
        processQueue();
        getQueuedCount().then(count => {
          setState(prev => ({ ...prev, queuedCount: count }));
        });
      }
    });

    const handleOnline = () => {
      console.log('[useOfflineEmergency] Back online');
      setState(prev => ({ ...prev, isOnline: true }));
      processQueue();
    };

    const handleOffline = () => {
      console.log('[useOfflineEmergency] Gone offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'OFFLINE_REQUEST_SYNCED') {
        console.log('[useOfflineEmergency] Request synced:', event.data.requestId);
        getQueuedCount().then(count => {
          setState(prev => ({ ...prev, queuedCount: count }));
        });
      }
      if (event.data.type === 'OFFLINE_REQUEST_FAILED') {
        console.log('[useOfflineEmergency] Request failed:', event.data.requestId, event.data.reason);
        getQueuedCount().then(count => {
          setState(prev => ({ ...prev, queuedCount: count }));
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[useOfflineEmergency] Controller changed');
        setState(prev => ({ ...prev, isServiceWorkerReady: true }));
      });
    }

    const updateQueuedCount = async () => {
      const count = await getQueuedCount();
      setState(prev => ({ ...prev, queuedCount: count }));
    };

    const interval = setInterval(updateQueuedCount, 5000);
    
    setTimeout(updateQueuedCount, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [ensureServiceWorkerReady, processQueue, getQueuedCount]);

  return {
    ...state,
    processQueue,
    getQueuedCount,
  };
}
