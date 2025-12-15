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
  const isMounted = useRef(true);
  const pendingUpdate = useRef<number | null>(null);

  // Safe setState that checks if component is still mounted
  const safeSetState = useCallback((updater: (prev: OfflineEmergencyState) => OfflineEmergencyState) => {
    if (isMounted.current) {
      // Cancel any pending update
      if (pendingUpdate.current !== null) {
        cancelAnimationFrame(pendingUpdate.current);
      }
      // Debounce state updates using requestAnimationFrame
      pendingUpdate.current = requestAnimationFrame(() => {
        if (isMounted.current) {
          setState(updater);
        }
        pendingUpdate.current = null;
      });
    }
  }, []);

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
      safeSetState(prev => ({ ...prev, isServiceWorkerReady: true }));
      return registration;
    } catch {
      return null;
    }
  }, [safeSetState]);

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
    // Set mounted flag
    isMounted.current = true;
    
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    ensureServiceWorkerReady().then(() => {
      if (!isMounted.current) return;
      
      if (navigator.onLine) {
        console.log('[useOfflineEmergency] Online at startup, processing any queued requests');
        processQueue();
        getQueuedCount().then(count => {
          safeSetState(prev => ({ ...prev, queuedCount: count }));
        });
      }
    });

    const handleOnline = () => {
      console.log('[useOfflineEmergency] Back online');
      safeSetState(prev => ({ ...prev, isOnline: true }));
      processQueue();
    };

    const handleOffline = () => {
      console.log('[useOfflineEmergency] Gone offline');
      safeSetState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!isMounted.current) return;
      
      if (event.data.type === 'OFFLINE_REQUEST_SYNCED') {
        console.log('[useOfflineEmergency] Request synced:', event.data.requestId);
        getQueuedCount().then(count => {
          safeSetState(prev => ({ ...prev, queuedCount: count }));
        });
      }
      if (event.data.type === 'OFFLINE_REQUEST_FAILED') {
        console.log('[useOfflineEmergency] Request failed:', event.data.requestId, event.data.reason);
        getQueuedCount().then(count => {
          safeSetState(prev => ({ ...prev, queuedCount: count }));
        });
      }
    };

    let messageListenerAdded = false;
    const handleControllerChange = () => {
      console.log('[useOfflineEmergency] Controller changed');
      safeSetState(prev => ({ ...prev, isServiceWorkerReady: true }));
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      messageListenerAdded = true;
    }

    const updateQueuedCount = async () => {
      if (!isMounted.current) return;
      const count = await getQueuedCount();
      safeSetState(prev => ({ ...prev, queuedCount: count }));
    };

    // Increase interval to reduce rapid updates (10 seconds instead of 5)
    const interval = setInterval(updateQueuedCount, 10000);
    
    // Delay initial count fetch
    const initialTimeout = setTimeout(updateQueuedCount, 2000);

    return () => {
      // Mark as unmounted first
      isMounted.current = false;
      
      // Cancel any pending animation frame
      if (pendingUpdate.current !== null) {
        cancelAnimationFrame(pendingUpdate.current);
      }
      
      // Clean up event listeners
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Clean up service worker listeners
      if (messageListenerAdded && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
      
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [ensureServiceWorkerReady, processQueue, getQueuedCount, safeSetState]);

  return {
    ...state,
    processQueue,
    getQueuedCount,
  };
}
